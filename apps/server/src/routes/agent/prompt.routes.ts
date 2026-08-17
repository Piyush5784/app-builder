import { Router, type Request, type Response } from "express";
import { agent } from "@/agent";
import type { AgentEvent } from "@package/shared";
import { ApiError, asyncHandler } from "@/middleware/error-handler";
import { normalLimiter } from "@/middleware/rate-limit";
import { validate } from "@/middleware/validate";
import { promptSchema, type PromptBody } from "@/schemas/agent.schema";
import { requireOwnedSession } from "@/routes/agent/shared";

const promptRouter = Router();

promptRouter.post(
  "/prompt",
  normalLimiter,
  validate(promptSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const userId = req.user.id;
    const { prompt, sessionId, model } = req.body as PromptBody;

    const modelOption =
      model === undefined
        ? agent.models.MODEL_REGISTRY[0]
        : agent.models.getModelOption(model);
    if (!modelOption) {
      throw new ApiError(400, "Invalid model");
    }

    const isNewSession = !sessionId;
    const sId = isNewSession ? crypto.randomUUID() : sessionId;

    if (!isNewSession) {
      await requireOwnedSession(sId, userId);
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const emit = (event: AgentEvent): void => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // A long tool call (npm run build, a big sandbox operation) can go
    // 30-90+ seconds without a single byte written to the stream — long
    // enough for an intermediate proxy (Cloudflare, Caddy) to treat the
    // connection as idle and drop it, which looks like a client-side hang
    // with no error ever reaching the frontend. A comment line is valid
    // SSE (ignored by EventSource/fetch readers) and keeps the connection
    // visibly alive without being a real event.
    const heartbeat = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 15_000);

    try {
      await agent.core.runAgent(
        sId,
        prompt,
        modelOption,
        emit,
        isNewSession,
        userId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      agent.telemetry.logger.error("agent", "prompt stream ended in error", {
        sessionId: sId,
        error: message,
      });
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
  }),
);

export default promptRouter;
