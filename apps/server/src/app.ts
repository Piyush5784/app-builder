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

// This is a pure JSON API server — no static assets go through it — so
// there's no case where a browser should be allowed to conditionally-cache
// (ETag/304) a response instead of hitting the DB fresh. Without this,
// Express's default auto-ETag can make the browser serve a stale list
// (e.g. the sidebar's session list right after creating a new session)
// straight from cache, with no network error and nothing for React Query's
// own invalidation to catch — the stale response never reaches it.
app.disable("etag");

// Belt and suspenders on top of disabling etag: an explicit no-store means
// no browser or intermediate proxy has a heuristic excuse to cache a GET
// here either, regardless of ETag/Last-Modified presence.
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

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
    // Binds the current request's logged-in user (if any) into the ZenStack
    // client so `auth()` in @@allow policies actually reflects who's asking
    // — without this, every policy referencing auth() sees no one, and
    // policies written as "always true" were the only thing that worked.
    getClient: async (req) => {
      const session = await auth.api
        .getSession({ headers: fromNodeHeaders(req.headers) })
        .catch(() => null);
      return session?.user ? zen.$setAuth({ id: session.user.id }) : zen;
    },
  }),
);

app.use("/api/v1", allRouter);

// Must be registered last — Express routes any next(err) call here by its 4-arg arity.
app.use(errorHandler);
