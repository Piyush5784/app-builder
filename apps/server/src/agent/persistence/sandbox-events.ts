import { prisma } from "@package/db";
import type { ToolCall } from "@/agent/types";

export async function createSandboxEvent(
  sessionId: string,
  call: ToolCall,
): Promise<void> {
  await prisma.sandboxEvent.create({
    data: { sessionId, toolCall: call as never },
  });
}

export async function listSandboxEvents(
  sessionId: string,
): Promise<ToolCall[]> {
  const rows = await prisma.sandboxEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { toolCall: true },
  });
  return rows.map((row) => row.toolCall as unknown as ToolCall);
}
