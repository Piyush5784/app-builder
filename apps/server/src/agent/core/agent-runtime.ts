import type { Sandbox } from "e2b";
import { MAX_AGENT_ITERATIONS } from "@/config";
import { SYSTEM_PROMPT } from "@/agent/core/prompt";
import { getProvider, type ProviderName } from "@/agent/providers";
import {
  updateSession,
  destroySandbox,
  SessionNotFoundError,
  openSandbox,
} from "@/agent/sandbox";
import { tools, executeTool } from "@/agent/tools";
import { isMutatingTool, recordEvent } from "@/agent/core/event-log";
import { getOrInitHistory, saveHistory } from "@/agent/core/context";
import {
  watchForCancellation,
  type RunWatcher,
} from "@/agent/core/cancellation";
import { emitAgentEvent } from "@/agent/events";
import {
  createAgentRun,
  updateAgentRun,
  updateAgentSessionName,
  createLLMCall,
  createAgentEvent,
  createToolInvocation,
} from "@/agent/persistence";
import { logger } from "@/agent/telemetry";
import type { ChatMessage, LLMProvider, ToolSchema } from "@/agent/types";

export interface AgentResult {
  sessionId: string;
  reply: string;
  previewUrl: string;
}

/**
 * The bounded tool-call loop: ask the model, run whatever tools it asked for,
 * feed results back, repeat until it stops calling tools or we hit the step limit.
 * Mutates `messages` in place so the caller keeps full history.
 */
async function runLoop(
  sessionId: string,
  runId: string,
  sandbox: Sandbox,
  provider: LLMProvider,
  tools: ToolSchema[],
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<string> {
  let finalReply = "";

  const maxSteps =
    provider.providerLabel === "ollama" ? Infinity : MAX_AGENT_ITERATIONS;

  for (let i = 0; i < maxSteps; i++) {
    if (signal.aborted) break;

    const step = i + 1;
    emitAgentEvent(sessionId, { type: "step_start", step });

    const promptSnapshot = [...messages];
    const callStartedAt = Date.now();
    let result: Awaited<ReturnType<LLMProvider["chat"]>>;
    try {
      result = await provider.chat(messages, tools, signal);
    } catch (error) {
      await createLLMCall({
        runId,
        provider: provider.providerLabel,
        model: provider.model,
        step,
        prompt: promptSnapshot,
        response: null,
        success: false,
        errorMessage: signal.aborted
          ? "Cancelled by user"
          : error instanceof Error
            ? error.message
            : String(error),
        latencyMs: Date.now() - callStartedAt,
      });
      // A deliberate cancellation, not a real failure — stop quietly instead
      // of bubbling up to runAgent's failure path (which would kill the sandbox).
      if (signal.aborted) break;
      throw error;
    }

    const llmCallId = await createLLMCall({
      runId,
      provider: provider.providerLabel,
      model: provider.model,
      step,
      prompt: promptSnapshot,
      response: { content: result.content, toolCalls: result.toolCalls },
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      success: true,
      latencyMs: Date.now() - callStartedAt,
    });

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

      emitAgentEvent(sessionId, {
        type: "tool_start",
        step,
        tool: call.name,
        args: call.arguments,
      });

      const toolStartedAt = Date.now();
      const output = await executeTool(sandbox, call);
      const durationMs = Date.now() - toolStartedAt;
      messages.push({
        role: "tool",
        content: output,
        toolCallId: call.id,
        name: call.name,
      });

      const success = !output.startsWith("Error");
      emitAgentEvent(sessionId, {
        type: "tool_end",
        step,
        tool: call.name,
        success,
        output,
      });
      await createToolInvocation({
        sessionId,
        runId,
        llmCallId,
        call,
        output,
        success,
        durationMs,
      });

      // Only log successful, state-mutating calls — replaying a failed edit
      // or a pure read wouldn't do anything useful if we rebuild from this.
      if (isMutatingTool(call.name) && success) {
        await recordEvent(sessionId, call);
      }
    }

    if (signal.aborted) break;

    if (i === maxSteps - 1) {
      finalReply =
        "Reached the step limit before finishing. Try again with a more specific request.";
      logger.error("loop", "step limit reached without finishing", {
        maxSteps,
      });
      await createAgentEvent(
        runId,
        "warning",
        "step limit reached without finishing",
        {
          maxSteps,
        },
      );
      messages.push({ role: "assistant", content: finalReply });
    }
  }

  if (signal.aborted) {
    finalReply = finalReply || "Cancelled by user.";
    emitAgentEvent(sessionId, { type: "cancelled" });
    return finalReply;
  }

  emitAgentEvent(sessionId, { type: "done", reply: finalReply });
  return finalReply;
}

/**
 * Resolves everything a caller needs (sandbox, provider, history) and runs
 * the tool-call loop against it.
 */
export async function runAgent(
  sessionId: string,
  userPrompt: string,
  providerName: ProviderName | undefined,
  // Fired as soon as the sandbox is ready (created/reused + replayed), before
  // the model loop starts. Lets the caller hand the preview URL to the user
  // right away instead of waiting for the whole run to finish.
  onSandboxReady: ((previewUrl: string) => void) | undefined,
  // True only for a session the route just generated itself (a genuinely new
  // build) — false for any client-supplied sessionId, which must already
  // exist or this throws SessionNotFoundError instead of fabricating one.
  isNewSession: boolean,
  // The authenticated caller — every session has exactly one owner, checked
  // against this on every access, not just at creation.
  userId: string,
): Promise<AgentResult> {
  const provider = getProvider(providerName);
  logger.model(provider.providerLabel, provider.model);
  let watcher: RunWatcher | undefined;

  try {
    let sandbox: Sandbox;
    let previewUrl: string;
    try {
      ({ sandbox, previewUrl } = await openSandbox(
        sessionId,
        isNewSession,
        userId,
      ));
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      try {
        const runId = await createAgentRun(
          sessionId,
          provider.providerLabel,
          userPrompt,
        );
        await updateAgentRun(runId, "", "failed", message);
      } catch (persistError) {
        logger.error("agent", "failed to record failed run", {
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

    onSandboxReady?.(previewUrl);

    if (isNewSession) {
      await updateAgentSessionName(sessionId, userPrompt);
    }

    const messages = await getOrInitHistory(sessionId, SYSTEM_PROMPT);
    messages.push({ role: "user", content: userPrompt });

    const runId = await createAgentRun(
      sessionId,
      provider.providerLabel,
      userPrompt,
    );
    watcher = watchForCancellation(runId);

    let reply: string;
    try {
      reply = await runLoop(
        sessionId,
        runId,
        sandbox,
        provider,
        tools,
        messages,
        watcher.signal,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("agent", "call failed", { error: message });
      emitAgentEvent(sessionId, { type: "error", message });
      await createAgentEvent(runId, "error", "agent run failed", {
        error: message,
      });
      await updateAgentRun(runId, "", "failed", message);
      await destroySandbox(sessionId);
      throw error;
    }

    await updateAgentRun(
      runId,
      reply,
      watcher.signal.aborted ? "failed" : "success",
      watcher.signal.aborted ? "Cancelled by user" : undefined,
    );

    await saveHistory(sessionId, messages);
    await updateSession(sessionId);

    return {
      sessionId,
      reply,
      previewUrl,
    };
  } finally {
    watcher?.stop();
  }
}
