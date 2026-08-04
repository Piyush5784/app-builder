import type { ChatMessage } from "@/agent/types";

// Per-session chat history, kept alongside the sandbox so a session's
// conversation survives across requests, not just the sandbox.
const histories = new Map<string, ChatMessage[]>();

export function getOrInitHistory(
  sessionId: string,
  systemPrompt: string,
): ChatMessage[] {
  return (
    histories.get(sessionId) ?? [{ role: "system", content: systemPrompt }]
  );
}

export function saveHistory(sessionId: string, messages: ChatMessage[]): void {
  histories.set(sessionId, messages);
}
