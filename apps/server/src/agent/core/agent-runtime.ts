import type { Sandbox } from "e2b";
import { MAX_AGENT_ITERATIONS } from "@/config";
import { SYSTEM_PROMPT } from "@/agent/core/prompt";
import { providers } from "@/agent/providers";
import { models, type ModelOption } from "@/agent/models";
import { sandbox, SessionNotFoundError } from "@/agent/sandbox";
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

// Paid-tier models require a positive balance; free-tier models are never
// gated on credits.
async function hasSufficientCredits(
  userId: string,
  tier: ModelOption["tier"],
): Promise<boolean> {
  if (tier !== "paid") return true;
  return (await persistence.credits.getUserCredits(userId)) > 0;
}

// Core Loop of the Agent: send messages to the LLM, get tool calls, execute them, and repeat until done or cancelled.
// DB writes per step: LLMCall, then per tool call: ToolInvocation;
// User.credits + CreditTransaction (persistence.credits.deductCredits) once
// per successful LLM call. AgentEvent only on the step-limit warning.
async function runLoop(
  sessionId: string,
  runId: string,
  userId: string,
  modelOption: ModelOption,
  sandboxHandle: Sandbox,
  provider: LLMProvider,
  tools: ToolSchema[],
  messages: ChatMessage[],
  signal: AbortSignal,
  emit: (event: AgentEvent) => void,
): Promise<{ reply: string; filesChanged: boolean }> {
  let finalReply = "";
  let filesChanged = false;

  for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
    if (signal.aborted) break;

    // Paid tier can run out of credits partway through a multi-step run,
    // not just at the start — re-checked every step, not just once.
    if (!(await hasSufficientCredits(userId, modelOption.tier))) {
      finalReply = finalReply || "Ran out of credits partway through the run.";
      break;
    }

    const step = i + 1;

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
    if (modelOption.tier === "paid") {
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
      }
    }

    // Each step's LLM call is recorded in the DB.
    const llmCall = await persistence.llmCalls.create({
      data: {
        runId,
        provider: provider.providerLabel,
        model: provider.model,
        step,
        prompt: promptSnapshot as never,
        response: { content: result.content, toolCalls: result.toolCalls } as never,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        success: true,
        latencyMs: Date.now() - callStartedAt,
        pricingId,
        cost,
      },
    });

    const creditsUsed =
      modelOption.tier === "free"
        ? models.FREE_MODEL_CREDITS_PER_CALL
        : cost !== undefined
          ? cost / models.USD_PER_CREDIT
          : 0;
    if (creditsUsed > 0) {
      await persistence.credits.deductCredits(
        userId,
        runId,
        creditsUsed,
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
      const output = await toolsModule.executer.executeTool(
        sandboxHandle,
        call,
      );
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

    // If we reach the max iterations, we set a final reply indicating that the step limit was reached.
    if (i === MAX_AGENT_ITERATIONS - 1) {
      finalReply =
        "Reached the step limit before finishing. Try again with a more specific request.";
      telemetry.logger.error("loop", "step limit reached without finishing", {
        maxSteps: MAX_AGENT_ITERATIONS,
      });

      await persistence.agentEvents.create({
        data: {
          runId,
          level: "warning",
          message: "step limit reached without finishing",
          metadata: { maxSteps: MAX_AGENT_ITERATIONS } as never,
        },
      });
      messages.push({ role: "assistant", content: finalReply });
    }
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

// Core Brain of the Agent: orchestrates the sandbox, LLM provider, and tool execution loop, handling errors and cancellations.
// DB writes: AgentRun (create, then update with the result), AgentSession
// (name set on a new session; upsert/refresh via sandbox.manager.openSandbox
// — see that function's comment), plus whatever runLoop writes.
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

  if (!(await hasSufficientCredits(userId, modelOption.tier))) {
    throw new InsufficientCreditsError();
  }

  let watcher: RunWatcher | undefined;

  try {
    let sandboxResult: { sandbox: Sandbox; previewUrl: string };

    try {
      sandboxResult = await sandbox.manager.openSandbox(
        sessionId,
        isNewSession,
        userId,
      );
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);

      try {
        // Records the run as failed so there's a trace that the agent never
        // started, even though it never got a runId of its own.
        await persistence.agentRuns.create({
          data: {
            sessionId,
            provider: provider.providerLabel,
            prompt: userPrompt,
            status: "failed",
            errorMessage: message,
            finishedAt: new Date(),
          },
        });
      } catch (persistError) {
        telemetry.logger.error("agent", "failed to record failed run", {
          error:
            persistError instanceof Error
              ? persistError.message
              : String(persistError),
        });
      }
      return {
        sessionId,
        reply:
          "Could not restore this session's previous changes after the sandbox restarted. Please try again.",
        previewUrl: "",
      };
    }

    const { sandbox: liveSandbox, previewUrl } = sandboxResult;

    emit({ type: "sandbox_ready", sessionId, previewUrl });

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

    let reply: string;
    let filesChanged: boolean;

    try {
      ({ reply, filesChanged } = await runLoop(
        sessionId,
        runId,
        userId,
        modelOption,
        liveSandbox,
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
        data: { runId, level: "error", message: "agent run failed", metadata: { error: message } as never },
      });

      await persistence.agentRuns.update({
        where: { id: runId },
        data: { reply: "", status: "failed", errorMessage: message, finishedAt: new Date() },
      });

      await sandbox.manager.destroySandbox(sessionId);

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
    await sandbox.manager.updateSession(sessionId);

    if (filesChanged) {
      try {
        await sandbox.manager.restartDevServer(liveSandbox);
      } catch (error) {
        // The run itself already succeeded — a failed restart just means the
        // preview may still show stale content, not worth failing the run over.
        telemetry.logger.error("sandbox", "dev server restart failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      sessionId,
      reply,
      previewUrl,
    };
  } finally {
    watcher?.stop();
  }
}
