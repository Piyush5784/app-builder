import { Router } from "express";
import { agent } from "@/agent";
import { asyncHandler } from "@/middleware/error-handler";
import { normalLimiter } from "@/middleware/rate-limit";
import { validate } from "@/middleware/validate";
import { updateSessionNameSchema } from "@/schemas/agent.schema";
import { createSuccessResponse } from "@/types/api-response";
import {
  requireOwnedSession,
  requireSessionIdParam,
  requireUserId,
} from "@/routes/agent/shared";

const MAX_SESSION_NAME_LENGTH = 100;

function truncateSessionName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= MAX_SESSION_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_SESSION_NAME_LENGTH)}…`;
}

const sessionsRouter = Router();

sessionsRouter.delete(
  "/sessions/:sessionId",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    await requireOwnedSession(sessionId, requireUserId(req));

    await agent.sandbox.manager.destroySandbox(sessionId);
    await agent.persistence.agentSessions.deleteMany({
      where: { id: sessionId },
    });
    res.status(200).json(createSuccessResponse({ sessionId }));
  }),
);

sessionsRouter.patch(
  "/sessions/:sessionId",
  normalLimiter,
  validate(updateSessionNameSchema),
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    const { name } = req.body;
    await requireOwnedSession(sessionId, requireUserId(req));

    await agent.persistence.agentSessions.updateMany({
      where: { id: sessionId },
      data: { name: truncateSessionName(name) },
    });
    res.status(200).json(createSuccessResponse({ sessionId }));
  }),
);

// Aborts whatever LLM call/tool loop is currently running for this session.
// A no-op (cancelled: false) if nothing was actually in flight.
sessionsRouter.post(
  "/sessions/:sessionId/cancel",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    await requireOwnedSession(sessionId, requireUserId(req));

    const cancelled = await agent.core.cancelRun(sessionId);
    res.status(200).json(createSuccessResponse({ sessionId, cancelled }));
  }),
);

export default sessionsRouter;
