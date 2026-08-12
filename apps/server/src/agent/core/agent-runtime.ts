import { SYSTEM_PROMPT } from "@/agent/core/prompt";
import { providers } from "@/agent/providers";
import { models, type ModelOption } from "@/agent/models";
import { sandbox } from "@/agent/sandbox";
import { guardrails } from "@/agent/guardrails";
import { toolsModule } from "@/agent/tools";
import { context } from "@/agent/core/context";
import { cancellation, type RunWatcher } from "@/agent/core/cancellation";
import { persistence } from "@/agent/persistence";
import { telemetry } from "@/agent/telemetry";
import type { ChatMessage, LLMProvider, ToolSchema } from "@/agent/types";
import { isMutatingTool, type AgentEvent } from "@package/shared";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Not enough credits to use this model.");
    this.name = "InsufficientCreditsError";
  }
}

export interface AgentResult {
  sessionId: string;
  reply: string;
  previewUrl: string;
}

/**
 * WHY:
 * A cheap, non-atomic pre-check used only to fail fast (skip opening a
 * sandbox, skip a step's LLM call) before an amount is actually spent. It is
 * not the enforcement point — every model's real cost is only known after
 * the call (token-based), so there's no atomic pre-call guard possible; this
 * balance > 0 check is just the best available signal upfront, same as how
 * usage-metered APIs (OpenAI, Anthropic) gate on remaining balance/quota
 * before a call and meter the actual cost afterward.
 */
async function hasSufficientCredits(userId: string): Promise<boolean> {
  return (await persistence.credits.getUserCredits(userId)) > 0;
}

// Core Loop of the Agent: send messages to the LLM, get tool calls, execute them, and repeat until done or cancelled.
// DB writes per step: LLMCall, then per tool call: ToolInvocation;
// User.credits + CreditTransaction (persistence.credits.deductCredits) once
// per successful LLM call, priced from actual token usage. AgentEvent only
// on the step-limit warning.
async function runLoop(
  sessionId: string,
  runId: string,
  userId: string,
  ensureSandbox: ReturnType<
    typeof guardrails.createSandboxGuardrail
  >["ensureSandbox"],
  provider: LLMProvider,
  tools: ToolSchema[],
  messages: ChatMessage[],
  signal: AbortSignal,
  emit: (event: AgentEvent) => void,
): Promise<{ reply: string; filesChanged: boolean }> {
  let finalReply = "";
  let filesChanged = false;

  // No fixed step cap — the loop runs until the model finishes on its own,
  // the run is cancelled, or the user runs out of credits (checked every
  // iteration below); credits are the actual bound on how long this can go.
  for (let i = 0; ; i++) {
    if (signal.aborted) break;

    const step = i + 1;

    // Every model is billed on actual usage, so a run can run out of credits
    // partway through a multi-step run, not just at the start — re-checked
    // every step, not just once.
    if (!(await hasSufficientCredits(userId))) {
      finalReply = finalReply || "Ran out of credits partway through the run.";
      break;
    }

    emit({ type: "step_start", step });

    const promptSnapshot = [...messages];

    const callStartedAt = Date.now();

    let result: Awaited<ReturnType<LLMProvider["chat"]>>;

    try {
      result = await provider.chat(messages, tools, signal, (delta) =>
        emit({ type: "token", delta }),
      );
    } catch (error) {
      await persistence.llmCalls.create({
        data: {
          runId,
          provider: provider.providerLabel,
          model: provider.model,
          step,
          prompt: promptSnapshot as never,
          response: null as never,
          success: false,
          errorMessage: signal.aborted
            ? "Cancelled by user"
            : error instanceof Error
              ? error.message
              : String(error),
          latencyMs: Date.now() - callStartedAt,
        },
      });

      if (signal.aborted) break;
      throw error;
    }

    let pricingId: string | undefined;
    let cost: number | undefined;
    const now = new Date();
    const pricing = await persistence.modelPricing.findFirst({
      where: {
        provider: provider.providerLabel,
        model: provider.model,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
      select: {
        id: true,
        inputPricePerMillion: true,
        outputPricePerMillion: true,
      },
    });
    if (pricing) {
      pricingId = pricing.id;
      cost =
        ((result.tokensIn ?? 0) / 1_000_000) *
          Number(pricing.inputPricePerMillion) +
        ((result.tokensOut ?? 0) / 1_000_000) *
          Number(pricing.outputPricePerMillion);
    } else {
      // Every model is expected to have a pricing row (see
      // packages/db/prisma/seed-model-pricing.ts) — this means a call went
      // out unbilled, worth knowing about rather than silently eating the
      // cost.
      telemetry.logger.error("agent", "no pricing configured for model", {
        provider: provider.providerLabel,
        model: provider.model,
      });
    }

    // Each step's LLM call is recorded in the DB.
    const llmCall = await persistence.llmCalls.create({
      data: {
        runId,
        provider: provider.providerLabel,
        model: provider.model,
        step,
        prompt: promptSnapshot as never,
        response: {
          content: result.content,
          toolCalls: result.toolCalls,
        } as never,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        success: true,
        latencyMs: Date.now() - callStartedAt,
        pricingId,
        cost,
      },
    });

    if (cost !== undefined && cost > 0) {
      await persistence.credits.deductCredits(
        userId,
        runId,
        cost / models.USD_PER_CREDIT,
        `${provider.providerLabel}/${provider.model} — step ${step}`,
      );
    }

    if (result.toolCalls.length === 0) {
      finalReply = result.content ?? "";
      messages.push({ role: "assistant", content: finalReply });
      break;
    }

    messages.push({
      role: "assistant",
      content: result.content,
      toolCalls: result.toolCalls,
    });

    for (const call of result.toolCalls) {
      if (signal.aborted) break;

      emit({
        type: "tool_start",
        step,
        tool: call.name,
        args: call.arguments,
      });

      const toolStartedAt = Date.now();
      const { sandbox: liveSandbox } = await ensureSandbox();
      const output = await toolsModule.executer.executeTool(liveSandbox, call);
      const durationMs = Date.now() - toolStartedAt;

      messages.push({
        role: "tool",
        content: output,
        toolCallId: call.id,
        name: call.name,
      });

      const success = !output.startsWith("Error");

      emit({
        type: "tool_end",
        step,
        tool: call.name,
        success,
        output,
      });

      await persistence.toolInvocations.create({
        data: {
          sessionId,
          runId,
          llmCallId: llmCall.id,
          toolName: call.name,
          arguments: call.arguments as never,
          output,
          status: success ? "success" : "failed",
          errorMessage: success ? undefined : output,
          durationMs,
        },
      });

      if (success && isMutatingTool(call.name)) filesChanged = true;
    }

    if (signal.aborted) break;
  }

  if (signal.aborted) {
    finalReply = finalReply || "Cancelled by user.";
    emit({ type: "cancelled" });
    return { reply: finalReply, filesChanged };
  }

  emit({ type: "done", reply: finalReply });
  return { reply: finalReply, filesChanged };
}

const MAX_SESSION_NAME_LENGTH = 100;

function truncateSessionName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= MAX_SESSION_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_SESSION_NAME_LENGTH)}…`;
}

// Core Brain of the Agent: orchestrates the session, LLM provider, and tool
// execution loop, handling errors and cancellations. The sandbox itself is
// opened lazily by the guardrail passed into runLoop, not here — a run
// that never calls a real tool never creates one.
// DB writes: AgentSession (created via ensureSessionExists on the very
// first message, name set if new), AgentRun (create, then update with the
// result), plus whatever runLoop and the guardrail write.
export async function runAgent(
  sessionId: string,
  userPrompt: string,
  modelOption: ModelOption,
  emit: (event: AgentEvent) => void,
  isNewSession: boolean,
  userId: string,
): Promise<AgentResult> {
  const provider = providers.getProvider(modelOption.provider);

  telemetry.logger.model(provider.providerLabel, provider.model);

  if (!(await hasSufficientCredits(userId))) {
    throw new InsufficientCreditsError();
  }

  let watcher: RunWatcher | undefined;

  try {
    // The session row exists from the very first message, regardless of
    // whether a sandbox ever gets created — a purely conversational run
    // still needs somewhere to save its message history against (see
    // ensureSessionExists's own comment).
    await sandbox.manager.ensureSessionExists(sessionId, userId);
    emit({ type: "session_ready", sessionId });

    if (isNewSession) {
      await persistence.agentSessions.updateMany({
        where: { id: sessionId },
        data: { name: truncateSessionName(userPrompt) },
      });
    }

    const messages = await context.getOrInitHistory(sessionId, SYSTEM_PROMPT);
    messages.push({ role: "user", content: userPrompt });

    const run = await persistence.agentRuns.create({
      data: { sessionId, provider: provider.providerLabel, prompt: userPrompt },
    });
    const runId = run.id;
    watcher = cancellation.watchForCancellation(runId);

    // Opens (or reconnects to) the sandbox lazily, the first time a tool
    // call actually needs one — see agent/guardrails/sandbox-guardrail.ts.
    const guardrail = guardrails.createSandboxGuardrail(
      sessionId,
      userId,
      emit,
    );

    let reply: string;
    let filesChanged: boolean;

    try {
      ({ reply, filesChanged } = await runLoop(
        sessionId,
        runId,
        userId,
        guardrail.ensureSandbox,
        provider,
        toolsModule.schema.tools,
        messages,
        watcher.signal,
        emit,
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      telemetry.logger.error("agent", "call failed", { error: message });

      emit({ type: "error", message });

      await persistence.agentEvents.create({
        data: {
          runId,
          level: "error",
          message: "agent run failed",
          metadata: { error: message } as never,
        },
      });

      await persistence.agentRuns.update({
        where: { id: runId },
        data: {
          reply: "",
          status: "failed",
          errorMessage: message,
          finishedAt: new Date(),
        },
      });

      // Only a sandbox that actually got created needs tearing down — a
      // run that failed before ever calling a tool never opened one.
      if (guardrail.getState()) {
        await sandbox.manager.destroySandbox(sessionId);
      }

      throw error;
    }

    await persistence.agentRuns.update({
      where: { id: runId },
      data: {
        reply,
        status: watcher.signal.aborted ? "failed" : "success",
        errorMessage: watcher.signal.aborted ? "Cancelled by user" : undefined,
        finishedAt: new Date(),
      },
    });

    await context.saveHistory(sessionId, messages);

    const sandboxState = guardrail.getState();

    if (sandboxState) {
      await sandbox.manager.updateSession(sessionId);

      if (filesChanged) {
        try {
          await sandbox.manager.restartDevServer(sandboxState.sandbox);
        } catch (error) {
          // The run itself already succeeded — a failed restart just means
          // the preview may still show stale content, not worth failing
          // the run over.
          telemetry.logger.error("sandbox", "dev server restart failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return {
      sessionId,
      reply,
      previewUrl: sandboxState?.previewUrl ?? "",
    };
  } finally {
    watcher?.stop();
  }
}
