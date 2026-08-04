import { prisma } from "@package/db";

export async function createAgentRun(
  sessionId: string,
  provider: string,
  prompt: string,
): Promise<string> {
  const run = await prisma.agentRun.create({
    data: { sessionId, provider, prompt },
  });
  return run.id;
}

export async function updateAgentRun(
  runId: string,
  reply: string,
  status: "success" | "failed",
  errorMessage?: string,
): Promise<void> {
  await prisma.agentRun.update({
    where: { id: runId },
    data: { reply, status, errorMessage, finishedAt: new Date() },
  });
}

// Flags whichever run is currently active for this session — returns false
// if there isn't one (already finished, or never started), same as the old
// in-memory cancelRun's "nothing to cancel" case.
export async function setCancelRequested(sessionId: string): Promise<boolean> {
  const run = await prisma.agentRun.findFirst({
    where: { sessionId, status: "running" },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  if (!run) return false;
  await prisma.agentRun.update({
    where: { id: run.id },
    data: { cancelRequested: true },
  });
  return true;
}

export async function isCancelRequested(runId: string): Promise<boolean> {
  const run = await prisma.agentRun.findUnique({
    where: { id: runId },
    select: { cancelRequested: true },
  });
  return run?.cancelRequested ?? false;
}
