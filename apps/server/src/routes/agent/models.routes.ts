import { Router } from "express";
import { agent } from "@/agent";
import { asyncHandler } from "@/middleware/error-handler";
import { createSuccessResponse } from "@/types/api-response";

const modelsRouter = Router();

// Only id/label — provider/model strings stay server-internal, not that
// they're secret, just no reason to expose more than the picker needs.
modelsRouter.get(
  "/models",
  asyncHandler(async (_req, res) => {
    const models = agent.models.MODEL_REGISTRY.map(({ id, label }) => ({
      id,
      label,
    }));
    res.status(200).json(createSuccessResponse({ models }));
  }),
);

export default modelsRouter;
