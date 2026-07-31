import type { Sandbox } from "e2b";
import { SYSTEM_PROMPT } from "./prompt";
import { getProvider, type ProviderName } from "./providers";
import { getOrCreateSandbox, getPreviewUrl, touchSession, destroySandbox } from "./sandbox";
import { tools } from "./tools/schema";
import { replayEvents } from "./tools/executer";
import { getEvents } from "./eventLog";
import { runLoop } from "./coreLogic";
import type { ChatMessage } from "./types";

export interface AgentResult {
  sessionId: string;
  reply: string;
  previewUrl: string;
}

// Per-session chat history, kept alongside the sandbox so a session's
// conversation survives across requests, not just the sandbox.
const histories = new Map<string, ChatMessage[]>();

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
      console.log(`[agent] session=${sessionId} — sandbox is fresh but has ${priorEvents.length} recorded event(s), replaying`);
      try {
        await replayEvents(sandbox, priorEvents);
      } catch (error) {
        console.error(`[agent] session=${sessionId} — replay failed:`, error);
        await destroySandbox(sessionId);
        throw error;
      }
    }
  }

  const previewUrl = getPreviewUrl(sandbox);
  console.log(`[agent] session=${sessionId} — sandbox ready at ${previewUrl}`);
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
 * Facade: resolves everything a caller needs (sandbox, provider, history) and
 * hands off to coreLogic for the actual loop. Callers only ever talk to this.
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
  console.log(`[agent] call started — session=${sessionId} provider=${providerName ?? "(default)"} prompt="${userPrompt}"`);

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
  const messages: ChatMessage[] = histories.get(sessionId) ?? [{ role: "system", content: SYSTEM_PROMPT }];
  messages.push({ role: "user", content: userPrompt });

  let reply: string;
  try {
    reply = await runLoop(sessionId, sandbox, provider, tools, messages);
  } catch (error) {
    console.error(`[agent] call failed — session=${sessionId}:`, error);
    await destroySandbox(sessionId);
    throw error;
  }

  histories.set(sessionId, messages);
  touchSession(sessionId);

  console.log(`[agent] call finished — session=${sessionId} reply="${reply}"`);

  return {
    sessionId,
    reply,
    previewUrl,
  };
}
