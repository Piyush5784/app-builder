import { prisma } from "@package/db";

const MAX_SESSION_NAME_LENGTH = 100;

function truncateSessionName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= MAX_SESSION_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_SESSION_NAME_LENGTH)}…`;
}

// Server-only ownership check, deliberately via plain prisma rather than the
// policy-enforced zen client — this check is what the rest of the app relies
// on to *establish* who's allowed to touch a session, so it can't itself be
// gated by a policy that needs that answer first.
export async function getAgentSessionOwnerId(
  sessionId: string,
): Promise<string | null> {
  const row = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });
  return row?.userId ?? null;
}

export async function upsertAgentSession(
  sessionId: string,
  sandboxId: string,
  userId: string,
): Promise<void> {
  await prisma.agentSession.upsert({
    where: { id: sessionId },
    create: { id: sessionId, sandboxId, userId },
    update: { sandboxId, lastActiveAt: new Date() },
  });
}

export async function updateAgentSession(sessionId: string): Promise<void> {
  await prisma.agentSession.updateMany({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
}

export async function updateAgentSessionName(
  sessionId: string,
  name: string,
): Promise<void> {
  await prisma.agentSession.updateMany({
    where: { id: sessionId },
    data: { name: truncateSessionName(name) },
  });
}

export async function deleteAgentSession(sessionId: string): Promise<void> {
  await prisma.agentSession.deleteMany({ where: { id: sessionId } });
}
