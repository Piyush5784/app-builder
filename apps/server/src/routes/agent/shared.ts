import type { Request } from "express";
import { agent } from "@/agent";
import { ApiError } from "@/middleware/error-handler";

export function requireUserId(req: Request): string {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  return req.user.id;
}

export async function requireOwnedSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  const session = await agent.persistence.agentSessions.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });
  if (session === null || session.userId !== userId) {
    throw new ApiError(404, `Session ${sessionId} does not exist`);
  }
}

export function requireSessionIdParam(sessionId: unknown): string {
  if (!sessionId || typeof sessionId !== "string") {
    throw new ApiError(400, "Invalid sessionId");
  }
  return sessionId;
}
