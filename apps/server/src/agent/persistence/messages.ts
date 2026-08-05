import { prisma } from "@package/db";
import type { ChatMessage, Role, ToolName } from "@/agent/types";

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

export async function loadHistory(sessionId: string): Promise<ChatMessage[]> {
  const rows = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { seq: "asc" },
  });
  return rows.map((row): ChatMessage => ({
    role: DB_TO_ROLE[row.role]!,
    content: row.content,
    toolCalls:
      (row.toolCalls as unknown as ChatMessage["toolCalls"]) ?? undefined,
    toolCallId: row.toolCallId ?? undefined,
    name: (row.name as ToolName | null) ?? undefined,
  }));
}

export async function countMessages(sessionId: string): Promise<number> {
  return prisma.message.count({ where: { sessionId } });
}

// Appends only — `existingCount` is the number of rows already persisted
// (from `countMessages`), so callers pass the full in-memory history and
// only what's beyond that count actually gets written.
export async function appendMessages(
  sessionId: string,
  existingCount: number,
  newMessages: ChatMessage[],
): Promise<void> {
  if (newMessages.length === 0) return;
  await prisma.message.createMany({
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
