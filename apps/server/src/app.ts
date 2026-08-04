import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { ZenStackMiddleware } from "@zenstackhq/server/express";
import { RPCApiHandler } from "@zenstackhq/server/api";
import { FRONTEND_URL } from "@/config";
import allRouter from "@/routes";
import { auth } from "@/lib/auth";
import { zen } from "@/lib/zen";
import { schema } from "@package/db/schema";
import { errorHandler } from "@/middleware/error-handler";

export const app = express();

app.use(morgan("dev"));
app.use(cors({ credentials: true, origin: FRONTEND_URL }));

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// better-auth needs the raw request stream, so mount it BEFORE express.json()
app.all("/api/v1/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());

const apiHandler = new RPCApiHandler({ schema });

app.use(
  "/api/model",
  ZenStackMiddleware({
    apiHandler,
    getClient: () => zen,
  }),
);

app.use("/api/v1", allRouter);

// Must be registered last — Express routes any next(err) call here by its 4-arg arity.
app.use(errorHandler);
