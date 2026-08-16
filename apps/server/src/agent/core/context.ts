import type { ChatMessage, Role, ToolName } from "@/agent/types";
import { persistence } from "@/agent/persistence";

const ROLE_TO_DB: Record<Role, string> = {
  system: "SYSTEM",
  user: "USER",
  assistant: "ASSISTANT",
  tool: "TOOL",
};

const DB_TO_ROLE: Record<string, Role> = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
  TOOL: "tool",
};

async function getOrInitHistory(
  sessionId: string,
  systemPrompt: string,
): Promise<ChatMessage[]> {
  const rows = await persistence.messages.findMany({
    where: { sessionId },
    orderBy: { seq: "asc" },
  });
  const existing: ChatMessage[] = rows.map((row) => ({
    role: DB_TO_ROLE[row.role]!,
    content: row.content,
    toolCalls:
      (row.toolCalls as unknown as ChatMessage["toolCalls"]) ?? undefined,
    toolCallId: row.toolCallId ?? undefined,
    name: (row.name as ToolName | null) ?? undefined,
  }));
  return existing.length > 0
    ? existing
    : [{ role: "system", content: systemPrompt }];
}

/**
 * DB writes: Message — reads the current row count, then appends only the
 * messages past that count.
 */
async function saveHistory(
  sessionId: string,
  allMessages: ChatMessage[],
): Promise<void> {
  const existingCount = await persistence.messages.count({
    where: { sessionId },
  });
  const newMessages = allMessages.slice(existingCount);
  if (newMessages.length === 0) return;
  await persistence.messages.createMany({
    data: newMessages.map((m, i) => ({
      sessionId,
      seq: existingCount + i,
      role: ROLE_TO_DB[m.role] as never,
      content: m.content,
      toolCalls: (m.toolCalls ?? undefined) as never,
      toolCallId: m.toolCallId,
      name: m.name,
    })),
  });
}

export const context = { getOrInitHistory, saveHistory };
