import { Router } from "express";
import { agent } from "@/agent";
import { SandboxNotCreatedError } from "@/agent/sandbox";
import { ApiError, asyncHandler } from "@/middleware/error-handler";
import { normalLimiter } from "@/middleware/rate-limit";
import { createSuccessResponse } from "@/types/api-response";
import { requireSessionIdParam, requireUserId } from "@/routes/agent/shared";

const sandboxRouter = Router();

// Reopens a session's sandbox (replaying its recorded changes if the old one
// died) and returns its preview URL. No LLM call — just the sandbox.
//
// A session that's only ever been chatted in has no sandbox yet — that's
// expected, ordinary state, not a failure, so it's a normal 200 with
// previewUrl: null rather than a 404. SessionNotFoundError (session
// doesn't exist / isn't owned by this user) is the real error case and
// still propagates to asyncHandler's .catch(next) as a 404.
sandboxRouter.get(
  "/sandbox/:sessionId",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    const userId = requireUserId(req);

    try {
      const result = await agent.core.getSandboxUrl(sessionId, userId);
      res.status(200).json(createSuccessResponse(result));
    } catch (error) {
      if (error instanceof SandboxNotCreatedError) {
        res
          .status(200)
          .json(createSuccessResponse({ sessionId, previewUrl: null }));
        return;
      }
      throw error;
    }
  }),
);

// Recursive file/folder listing for the workspace's code view.
sandboxRouter.get(
  "/sandbox/:sessionId/files",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    const userId = requireUserId(req);

    const tree = await agent.core.listSandboxFiles(sessionId, userId);
    res.status(200).json(createSuccessResponse(tree));
  }),
);

// A single file's content for the code view.
sandboxRouter.get(
  "/sandbox/:sessionId/file",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    const { path } = req.query;
    if (!path || typeof path !== "string") {
      throw new ApiError(400, "Invalid path");
    }
    const userId = requireUserId(req);

    const content = await agent.core.readSandboxFile(sessionId, path, userId);
    res.status(200).json(createSuccessResponse({ path, content }));
  }),
);

sandboxRouter.get(
  "/sandbox/:sessionId/download",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    const userId = requireUserId(req);

    const archive = await agent.core.downloadSandboxZip(sessionId, userId);

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

export default sandboxRouter;
