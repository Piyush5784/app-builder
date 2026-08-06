import { Router, type Request, type Response } from "express";
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
import { logger } from "@/agent/telemetry";
import type { AgentEvent } from "@package/shared";
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

agentRouter.use(AuthMiddleware);

function requireUserId(req: Request): string {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  return req.user.id;
}

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

async function requireOwnedSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  const ownerId = await getAgentSessionOwnerId(sessionId);
  if (ownerId === null || ownerId !== userId) {
    throw new ApiError(404, `Session ${sessionId} does not exist`);
  }
}

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

agentRouter.post(
  "/prompt",
  normalLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const userId = req.user.id;
    const { prompt, sessionId, provider } = req.body;

    if (!prompt || typeof prompt !== "string") {
      throw new ApiError(400, "Invalid prompt");
    }

    const isNewSession = !(sessionId && typeof sessionId === "string");
    const sId = isNewSession ? crypto.randomUUID() : sessionId;

    if (!isNewSession) {
      await requireOwnedSession(sId, userId);
    }

    const providerName: ProviderName | undefined =
      provider === "gemini" ||
      provider === "openrouter" ||
      provider === "ollama" ||
      provider === "nvidia"
        ? provider
        : "nvidia"; // default provider

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const emit = (event: AgentEvent): void => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      await runAgent(sId, prompt, providerName, emit, isNewSession, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("agent", "prompt stream ended in error", {
        sessionId: sId,
        error: message,
      });
    } finally {
      res.end();
    }
  }),
);

export default agentRouter;
