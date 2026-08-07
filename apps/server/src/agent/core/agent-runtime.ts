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
import { getOrInitHistory, saveHistory } from "@/agent/core/context";
import {
  watchForCancellation,
  type RunWatcher,
} from "@/agent/core/cancellation";
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
import type { AgentEvent } from "@package/shared";

export interface AgentResult {
  sessionId: string;
  reply: string;
  previewUrl: string;
}

// Core Loop of the Agent: send messages to the LLM, get tool calls, execute them, and repeat until done or cancelled.
// DB writes per step: LLMCall (createLLMCall), then per tool call:
// ToolInvocation (createToolInvocation). AgentEvent only on the step-limit
// warning.
async function runLoop(
  sessionId: string,
  runId: string,
  sandbox: Sandbox,
  provider: LLMProvider,
  tools: ToolSchema[],
  messages: ChatMessage[],
  signal: AbortSignal,
  emit: (event: AgentEvent) => void,
): Promise<string> {
  let finalReply = "";

  for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
    // About: if cancel by client happened between ilteration
    if (signal.aborted) break;

    const step = i + 1;

    //Emit to Client that a new step has started
    emit({ type: "step_start", step });

    const promptSnapshot = [...messages];

    const callStartedAt = Date.now();

    let result: Awaited<ReturnType<LLMProvider["chat"]>>;

    try {
      result = await provider.chat(messages, tools, signal, (delta) =>
        emit({ type: "token", delta }),
      );
    } catch (error) {
      // For Failer, Mark the LLM Call as Failed
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

      // Abort: On Failer
      if (signal.aborted) break;
      throw error;
    }

    // Each Step LLM call is recorded in the DB
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

      emit({
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

      emit({
        type: "tool_end",
        step,
        tool: call.name,
        success,
        output,
      });

      // For Each Tool Call, Record the Invocation in the DB
      await createToolInvocation({
        sessionId,
        runId,
        llmCallId,
        call,
        output,
        success,
        durationMs,
      });
    }

    // About: if cancel by client happened between ilteration
    if (signal.aborted) break;

    // If we reach the max iterations, we set a final reply indicating that the step limit was reached.
    if (i === MAX_AGENT_ITERATIONS - 1) {
      finalReply =
        "Reached the step limit before finishing. Try again with a more specific request.";
      logger.error("loop", "step limit reached without finishing", {
        maxSteps: MAX_AGENT_ITERATIONS,
      });

      await createAgentEvent(
        runId,
        "warning",
        "step limit reached without finishing",
        {
          maxSteps: MAX_AGENT_ITERATIONS,
        },
      );
      messages.push({ role: "assistant", content: finalReply });
    }
  }

  // Abort: On completion of the loop, if the signal is aborted
  if (signal.aborted) {
    finalReply = finalReply || "Cancelled by user.";
    emit({ type: "cancelled" });
    return finalReply;
  }

  emit({ type: "done", reply: finalReply });
  return finalReply;
}

// Core Brain of the Agent: orchestrates the sandbox, LLM provider, and tool execution loop, handling errors and cancellations.
// DB writes: AgentRun (createAgentRun, then updateAgentRun with the result),
// AgentSession (updateAgentSessionName on a new session; upsert/refresh via
// openSandbox — see that function's comment), plus whatever runLoop writes.
export async function runAgent(
  sessionId: string,
  userPrompt: string,
  providerName: ProviderName | undefined,
  emit: (event: AgentEvent) => void,
  isNewSession: boolean,
  userId: string,
): Promise<AgentResult> {
  const provider = getProvider(providerName);

  // Logger: Only for Server Logs
  logger.model(provider.providerLabel, provider.model);
  let watcher: RunWatcher | undefined;

  try {
    let sandboxResult: { sandbox: Sandbox; previewUrl: string };

    try {
      // Open or Create the Sandbox for the Session. If it's a new sandbox, replay any prior events onto it.
      sandboxResult = await openSandbox(sessionId, isNewSession, userId);
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);

      try {
        // Mark the run as failed: To keep track Agent Never started due to sandbox failure
        await createAgentRun(sessionId, provider.providerLabel, userPrompt, {
          errorMessage: message,
        });
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

    const { sandbox, previewUrl } = sandboxResult;

    emit({ type: "sandbox_ready", sessionId, previewUrl });

    // Marked the session as having a name with the name
    if (isNewSession) {
      await updateAgentSessionName(sessionId, userPrompt);
    }

    // Get or Initialize the Chat History for the Session, and append the user's prompt to it.
    const messages = await getOrInitHistory(sessionId, SYSTEM_PROMPT);
    messages.push({ role: "user", content: userPrompt });

    // Create a new Agent Run in the DB, and set up a cancellation watcher for it.
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
        emit,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error("agent", "call failed", { error: message });

      emit({ type: "error", message });

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
