import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { ZenStackMiddleware } from "@zenstackhq/server/express";
import { RPCApiHandler } from "@zenstackhq/server/api";
import { FRONTEND_URL } from "@/config";
import allRouter from "@/routes";
import { auth } from "@/lib/auth";
import { zen } from "@/lib/zen";
import { schema } from "@package/db/schema";
import { errorHandler } from "@/middleware/error-handler";

export const app = express();

app.set("trust proxy", 2);

app.disable("etag");
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(morgan("dev"));
app.use(cors({ credentials: true, origin: FRONTEND_URL }));

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.all("/api/v1/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());

const apiHandler = new RPCApiHandler({ schema });

app.use(
  "/api/model",
  ZenStackMiddleware({
    apiHandler,
    getClient: async (req) => {
      const session = await auth.api
        .getSession({ headers: fromNodeHeaders(req.headers) })
        .catch(() => null);
      return session?.user ? zen.$setAuth({ id: session.user.id }) : zen;
    },
  }),
);

app.use("/api/v1", allRouter);

app.use(errorHandler);
