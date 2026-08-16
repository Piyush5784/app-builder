import { Router } from "express";
import { agent } from "@/agent";
import { asyncHandler } from "@/middleware/error-handler";
import { createSuccessResponse } from "@/types/api-response";
import { normalLimiter } from "@/middleware/rate-limit";

const modelsRouter = Router();

modelsRouter.get(
  "/models",
  normalLimiter,
  asyncHandler(async (_req, res) => {
    const models = agent.models.MODEL_REGISTRY.map(({ id, label }) => ({
      id,
      label,
    }));
    res.status(200).json(createSuccessResponse({ models }));
  }),
);

export default modelsRouter;
