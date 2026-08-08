import { Router } from "express";
import { agent } from "@/agent";
import { ApiError, asyncHandler } from "@/middleware/error-handler";
import { normalLimiter } from "@/middleware/rate-limit";
import { createSuccessResponse } from "@/types/api-response";
import { requireSessionIdParam, requireUserId } from "@/routes/agent/shared";

const sandboxRouter = Router();

// Reopens a session's sandbox (replaying its recorded changes if the old one
// died) and returns its preview URL. No LLM call — just the sandbox.
sandboxRouter.get(
  "/sandbox/:sessionId",
  normalLimiter,
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    const userId = requireUserId(req);

    const result = await agent.core.getSandboxUrl(sessionId, userId);
    res.status(200).json(createSuccessResponse(result));
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
