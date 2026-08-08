import type { ToolCall } from "@/agent/types";
import { MUTATING_TOOLS } from "@package/shared";
import { persistence } from "@/agent/persistence";

async function getEvents(sessionId: string): Promise<ToolCall[]> {
  const rows = await persistence.toolInvocations.findMany({
    where: {
      sessionId,
      status: "success",
      toolName: { in: [...MUTATING_TOOLS] },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, toolName: true, arguments: true },
  });
  return rows.map(
    (row) =>
      ({
        id: row.id,
        name: row.toolName,
        arguments: row.arguments,
      }) as unknown as ToolCall,
  );
}

export const eventLog = { getEvents };
