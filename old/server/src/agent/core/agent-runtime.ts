import type { Sandbox } from "e2b";
import { config } from "@/agent/config";
import { SYSTEM_PROMPT } from "@/agent/core/prompt";
import { getProvider, type ProviderName } from "@/agent/providers";
import { getOrCreateSandbox, getPreviewUrl, touchSession, destroySandbox } from "@/agent/sandbox";
import { tools, executeTool, replayEvents } from "@/agent/tools";
import { isMutatingTool, recordEvent, getEvents } from "@/agent/core/event-log";
import { getOrInitHistory, saveHistory } from "@/agent/core/context";
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
  sandbox: Sandbox,
  provider: LLMProvider,
  tools: ToolSchema[],
  messages: ChatMessage[]
): Promise<string> {
  let finalReply = "";

  for (let i = 0; i < config.maxAgentIterations; i++) {
    const step = i + 1;
    logger.info("loop", "calling model", { sessionId, step, maxSteps: config.maxAgentIterations });

    const result = await provider.chat(messages, tools);

    if (result.toolCalls.length === 0) {
      finalReply = result.content ?? "";
      logger.info("loop", "model finished, no more tool calls", { sessionId, step });
      messages.push({ role: "assistant", content: finalReply });
      break;
    }

    logger.info("loop", "model requested tool call(s)", {
      sessionId,
      step,
      tools: result.toolCalls.map((c) => c.name),
    });

    messages.push({ role: "assistant", content: result.content, toolCalls: result.toolCalls });

    for (const call of result.toolCalls) {
      const output = await executeTool(sandbox, call);
      logger.info("loop", "tool result", { sessionId, step, tool: call.name, output: output.slice(0, 300) });
      messages.push({ role: "tool", content: output, toolCallId: call.id, name: call.name });

      // Only log successful, state-mutating calls — replaying a failed edit
      // or a pure read wouldn't do anything useful if we rebuild from this.
      if (isMutatingTool(call.name) && !output.startsWith("Error")) {
        recordEvent(sessionId, call);
      }
    }

    if (i === config.maxAgentIterations - 1) {
      finalReply = "Reached the step limit before finishing. Try again with a more specific request.";
      logger.warn("loop", "step limit reached without finishing", { sessionId, maxSteps: config.maxAgentIterations });
      messages.push({ role: "assistant", content: finalReply });
    }
  }

  return finalReply;
}

/**
 * Gets or creates the session's sandbox and, if it's a fresh one, replays
 * its recorded events onto it. No LLM call happens here — this is the part
 * of runAgent that both the agent and the plain "reopen my sandbox" route share.
 */
async function openSandbox(sessionId: string): Promise<{ sandbox: Sandbox; previewUrl: string }> {
  const { sandbox, isNew } = await getOrCreateSandbox(sessionId);

  if (isNew) {
    const priorEvents = getEvents(sessionId);
    if (priorEvents.length > 0) {
      logger.info("agent", "sandbox is fresh but has recorded events, replaying", {
        sessionId,
        eventCount: priorEvents.length,
      });
      try {
        await replayEvents(sandbox, priorEvents);
      } catch (error) {
        logger.error("agent", "replay failed", {
          sessionId,
          error: error instanceof Error ? error.message : String(error),
        });
        await destroySandbox(sessionId);
        throw error;
      }
    }
  }

  const previewUrl = getPreviewUrl(sandbox);
  logger.info("agent", "sandbox ready", { sessionId, previewUrl });
  return { sandbox, previewUrl };
}

/**
 * Reopens a session's sandbox (creating + replaying it if the old one died)
 * and returns its preview URL. No LLM call, no tool loop — just the sandbox.
 */
export async function getSandboxUrl(sessionId: string): Promise<{ sessionId: string; previewUrl: string }> {
  const { previewUrl } = await openSandbox(sessionId);
  return { sessionId, previewUrl };
}

/**
 * Resolves everything a caller needs (sandbox, provider, history) and runs
 * the tool-call loop against it.
 */
export async function runAgent(
  sessionId: string,
  userPrompt: string,
  providerName?: ProviderName,
  // Fired as soon as the sandbox is ready (created/reused + replayed), before
  // the model loop starts. Lets the caller hand the preview URL to the user
  // right away instead of waiting for the whole run to finish.
  onSandboxReady?: (previewUrl: string) => void
): Promise<AgentResult> {
  logger.info("agent", "call started", { sessionId, provider: providerName ?? "(default)", prompt: userPrompt });

  let sandbox: Sandbox;
  let previewUrl: string;
  try {
    ({ sandbox, previewUrl } = await openSandbox(sessionId));
  } catch (error) {
    return {
      sessionId,
      reply: "Could not restore this session's previous changes after the sandbox restarted. Please try again.",
      previewUrl: "",
    };
  }

  onSandboxReady?.(previewUrl);

  const provider = getProvider(providerName);
  const messages = getOrInitHistory(sessionId, SYSTEM_PROMPT);
  messages.push({ role: "user", content: userPrompt });

  let reply: string;
  try {
    reply = await runLoop(sessionId, sandbox, provider, tools, messages);
  } catch (error) {
    logger.error("agent", "call failed", { sessionId, error: error instanceof Error ? error.message : String(error) });
    await destroySandbox(sessionId);
    throw error;
  }

  saveHistory(sessionId, messages);
  touchSession(sessionId);

  logger.info("agent", "call finished", { sessionId, reply });

  return {
    sessionId,
    reply,
    previewUrl,
  };
}
