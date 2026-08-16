import { Router } from "express";
import { agent } from "@/agent";
import { SandboxNotCreatedError } from "@/agent/sandbox";
import { ApiError, asyncHandler } from "@/middleware/error-handler";
import { normalLimiter } from "@/middleware/rate-limit";
import { validate } from "@/middleware/validate";
import {
  writeSandboxFileSchema,
  type WriteSandboxFileBody,
} from "@/schemas/agent.schema";
import { createSuccessResponse } from "@/types/api-response";
import { requireSessionIdParam, requireUserId } from "@/routes/agent/shared";

const sandboxRouter = Router();

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
        const toolInvocations = await agent.core.getToolInvocations(sessionId);
        res.status(200).json(
          createSuccessResponse({
            sessionId,
            previewUrl: null,
            toolInvocations,
          }),
        );
        return;
      }
      throw error;
    }
  }),
);

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

sandboxRouter.put(
  "/sandbox/:sessionId/file",
  normalLimiter,
  validate(writeSandboxFileSchema),
  asyncHandler(async (req, res) => {
    const sessionId = requireSessionIdParam(req.params.sessionId);
    const userId = requireUserId(req);
    const { path, content } = req.body as WriteSandboxFileBody;

    await agent.core.writeSandboxFile(sessionId, path, content, userId);
    res.status(200).json(createSuccessResponse({ path }));
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
