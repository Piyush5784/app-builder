import { Router } from "express";
import { AuthMiddleware } from "@/middleware/auth";
import modelsRouter from "@/routes/agent/models.routes";
import sessionsRouter from "@/routes/agent/sessions.routes";
import sandboxRouter from "@/routes/agent/sandbox.routes";
import promptRouter from "@/routes/agent/prompt.routes";

const agentRouter = Router();

agentRouter.use(AuthMiddleware);

agentRouter.use(modelsRouter);
agentRouter.use(sessionsRouter);
agentRouter.use(sandboxRouter);
agentRouter.use(promptRouter);

export default agentRouter;
