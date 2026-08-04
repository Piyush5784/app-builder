import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  runAgent,
  cancelRun,
  getSandboxUrl,
  listSandboxFiles,
  readSandboxFile,
  downloadSandboxZip,
  type ProviderName,
} from "@/agent";
import { destroySandbox, SessionNotFoundError } from "@/agent/sandbox";
import { emitAgentEvent } from "@/agent/events";
import { logger } from "@/agent/telemetry";
import {
  deleteAgentSession,
  updateAgentSessionName,
  getAgentSessionOwnerId,
} from "@/agent/persistence";
import { AuthMiddleware } from "@/middleware/auth";
import { ApiError, asyncHandler } from "@/middleware/error-handler";
import { normalLimiter } from "@/middleware/rate-limit";
import { createSuccessResponse } from "@/types/api-response";

const agentRouter = Router();

// Every route below needs to know who's asking — sessions are owned, and
// nothing here is public.
agentRouter.use(AuthMiddleware);

function requireUserId(req: Request): string {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  return req.user.id;
}

// SessionNotFoundError means the id doesn't exist (deleted, made up, or the
// in-memory sandbox map was never populated for it) — a 404, not a 500.
async function withSessionErrorMapping<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      throw new ApiError(404, error.message);
    }
    throw error;
  }
}

// Deliberately indistinguishable from "doesn't exist" — never reveals that
// a sessionId belongs to someone else.
async function requireOwnedSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  const ownerId = await getAgentSessionOwnerId(sessionId);
  if (ownerId === null || ownerId !== userId) {
    throw new ApiError(404, `Session ${sessionId} does not exist`);
  }
}

// Kills the sandbox first (if it's still alive in-memory) so it can't be
// left running with nothing pointing at it, then removes the DB row —
// cascades to that session's AgentRun/LLMCall/ToolInvocation history.
agentRouter.delete(
  "/sessions/:sessionId",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError(400, "Invalid sessionId");
    }
    await requireOwnedSession(sessionId, requireUserId(req));

    await destroySandbox(sessionId);
    await deleteAgentSession(sessionId);
    res.status(200).json(createSuccessResponse({ sessionId }));
  }),
);

// Manual rename from the sidebar — overrides whatever name the first prompt
// gave the session (or the null default, if it was somehow never set).
agentRouter.patch(
  "/sessions/:sessionId",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { name } = req.body;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError(400, "Invalid sessionId");
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new ApiError(400, "Invalid name");
    }
    await requireOwnedSession(sessionId, requireUserId(req));

    await updateAgentSessionName(sessionId, name);
    res.status(200).json(createSuccessResponse({ sessionId }));
  }),
);

// Aborts whatever LLM call/tool loop is currently running for this session.
// A no-op (cancelled: false) if nothing was actually in flight.
agentRouter.post(
  "/sessions/:sessionId/cancel",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError(400, "Invalid sessionId");
    }
    await requireOwnedSession(sessionId, requireUserId(req));

    const cancelled = await cancelRun(sessionId);
    res.status(200).json(createSuccessResponse({ sessionId, cancelled }));
  }),
);

// Reopens a session's sandbox (replaying its recorded changes if the old one
// died) and returns its preview URL. No LLM call — just the sandbox.
agentRouter.get(
  "/sandbox/:sessionId",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError(400, "Invalid sessionId");
    }
    const userId = requireUserId(req);

    const result = await withSessionErrorMapping(() =>
      getSandboxUrl(sessionId, userId),
    );
    res.status(200).json(createSuccessResponse(result));
  }),
);

// Recursive file/folder listing for the workspace's code view.
agentRouter.get(
  "/sandbox/:sessionId/files",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError(400, "Invalid sessionId");
    }
    const userId = requireUserId(req);

    const tree = await withSessionErrorMapping(() =>
      listSandboxFiles(sessionId, userId),
    );
    res.status(200).json(createSuccessResponse(tree));
  }),
);

// A single file's content for the code view.
agentRouter.get(
  "/sandbox/:sessionId/file",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { path } = req.query;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError(400, "Invalid sessionId");
    }
    if (!path || typeof path !== "string") {
      throw new ApiError(400, "Invalid path");
    }
    const userId = requireUserId(req);

    const content = await withSessionErrorMapping(() =>
      readSandboxFile(sessionId, path, userId),
    );
    res.status(200).json(createSuccessResponse({ path, content }));
  }),
);

// Zips every file in the sandbox for a "download all" button. Streamed
// straight to the response — never buffered fully in memory.
agentRouter.get(
  "/sandbox/:sessionId/download",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError(400, "Invalid sessionId");
    }
    const userId = requireUserId(req);

    const archive = await withSessionErrorMapping(() =>
      downloadSandboxZip(sessionId, userId),
    );

    res.status(200);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sessionId}.zip"`,
    );
    archive.on("error", (error) => res.destroy(error));
    archive.pipe(res);
  }),
);

// Not wrapped in asyncHandler — this responds twice over the run's lifetime
// (early with the preview URL once the sandbox is ready, then either not at
// all again or, if the early response never fired, with the final result),
// which doesn't fit asyncHandler's "one promise, one response" shape.
agentRouter.post(
  "/prompt",
  normalLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, "Unauthorized"));
      return;
    }
    const userId = req.user.id;
    const { prompt, sessionId, provider } = req.body;

    if (!prompt || typeof prompt !== "string") {
      next(new ApiError(400, "Invalid prompt"));
      return;
    }

    const isNewSession = !(sessionId && typeof sessionId === "string");
    const sId = isNewSession ? crypto.randomUUID() : sessionId;
    const providerName: ProviderName | undefined =
      provider === "gemini" ||
      provider === "openrouter" ||
      provider === "ollama" ||
      provider === "nvidia"
        ? provider
        : "nvidia";

    let responded = false;

    runAgent(
      sId,
      prompt,
      providerName,
      (previewUrl) => {
        responded = true;
        res
          .status(200)
          .json(createSuccessResponse({ sessionId: sId, previewUrl }));
      },
      isNewSession,
      userId,
    )
      .then((result) => {
        // Only happens if onSandboxReady never fired (e.g. replay failed before
        // the sandbox was usable) — the early response above covers the normal path.
        if (!responded) {
          res.status(200).json(createSuccessResponse(result));
        }
      })
      .catch((error) => {
        if (!responded) {
          next(
            error instanceof SessionNotFoundError
              ? new ApiError(404, error.message)
              : error,
          );
          return;
        }
        // The HTTP response already went out (early sandbox-ready reply), so
        // there's no request left to fail — the only way the client learns
        // about this is the SSE event stream it's already listening on.
        const message = error instanceof Error ? error.message : String(error);
        logger.error("agent", "post-response failure in /prompt", {
          sessionId: sId,
          error: message,
        });
        emitAgentEvent(sId, { type: "error", message });
      });
  },
);

export default agentRouter;
