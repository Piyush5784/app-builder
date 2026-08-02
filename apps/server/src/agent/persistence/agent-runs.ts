import { prisma } from "@package/db";

export async function createAgentRun(sessionId: string, provider: string, prompt: string): Promise<string> {
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
