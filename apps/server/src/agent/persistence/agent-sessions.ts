import { prisma } from "@package/db";

export async function upsertAgentSession(
  sessionId: string,
  sandboxId: string,
): Promise<void> {
  await prisma.agentSession.upsert({
    where: { id: sessionId },
    create: { id: sessionId, sandboxId },
    update: { sandboxId, lastActiveAt: new Date() },
  });
}

// `updateMany` rather than `update` — this is a best-effort activity bump,
// not a place we want a P2025 throw if the row somehow isn't there yet.
export async function updateAgentSession(sessionId: string): Promise<void> {
  await prisma.agentSession.updateMany({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
}
