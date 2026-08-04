import type { ChatMessage } from "@/agent/types";
import {
  loadHistory,
  countMessages,
  appendMessages,
} from "@/agent/persistence";

export async function getOrInitHistory(
  sessionId: string,
  systemPrompt: string,
): Promise<ChatMessage[]> {
  const existing = await loadHistory(sessionId);
  return existing.length > 0
    ? existing
    : [{ role: "system", content: systemPrompt }];
}

// Appends whatever's new since the last save — `messages` is the full,
// mutated-in-place history for the run, so only the tail beyond what's
// already persisted actually gets written.
export async function saveHistory(
  sessionId: string,
  messages: ChatMessage[],
): Promise<void> {
  const existingCount = await countMessages(sessionId);
  await appendMessages(sessionId, existingCount, messages.slice(existingCount));
}
