import { Router, type Request, type Response, type NextFunction } from "express";
import { runAgent, getSandboxUrl, type ProviderName } from "@/agent";
import { ApiError, asyncHandler } from "@/middleware/error-handler";
import { normalLimiter } from "@/middleware/rate-limit";
import { createSuccessResponse } from "@/types/api-response";

const agentRouter = Router();

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

    const result = await getSandboxUrl(sessionId);
    res.status(200).json(createSuccessResponse(result));
  })
);

// Not wrapped in asyncHandler — this responds twice over the run's lifetime
// (early with the preview URL once the sandbox is ready, then either not at
// all again or, if the early response never fired, with the final result),
// which doesn't fit asyncHandler's "one promise, one response" shape.
agentRouter.post("/prompt", normalLimiter, (req: Request, res: Response, next: NextFunction) => {
  const { prompt, sessionId, provider } = req.body;

  if (!prompt || typeof prompt !== "string") {
    next(new ApiError(400, "Invalid prompt"));
    return;
  }

  const sId = sessionId && typeof sessionId === "string" ? sessionId : crypto.randomUUID();
  const providerName: ProviderName | undefined =
    provider === "gemini" || provider === "openrouter" || provider === "ollama" ? provider : undefined;

  let responded = false;

  runAgent(sId, prompt, providerName, (previewUrl) => {
    responded = true;
    res.status(200).json(createSuccessResponse({ sessionId: sId, previewUrl }));
  })
    .then((result) => {
      // Only happens if onSandboxReady never fired (e.g. replay failed before
      // the sandbox was usable) — the early response above covers the normal path.
      if (!responded) {
        res.status(200).json(createSuccessResponse(result));
      }
    })
    .catch((error) => {
      if (!responded) {
        next(error);
      }
    });
});

export default agentRouter;
