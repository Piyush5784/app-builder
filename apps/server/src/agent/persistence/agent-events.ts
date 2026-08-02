import { prisma } from "@package/db";

export async function createAgentEvent(
  runId: string,
  level: "info" | "warning" | "error",
  message: string,
  metadata?: unknown,
): Promise<void> {
  await prisma.agentEvent.create({
    data: { runId, level, message, metadata: metadata as never },
  });
}
