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

export async function saveHistory(
  sessionId: string,
  messages: ChatMessage[],
): Promise<void> {
  const existingCount = await countMessages(sessionId);
  await appendMessages(sessionId, existingCount, messages.slice(existingCount));
}
