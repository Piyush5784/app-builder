import { Router } from "express";
import agentRouter from "@/routes/agent";

const allRouter = Router();

allRouter.use("/agent", agentRouter);

export default allRouter;
