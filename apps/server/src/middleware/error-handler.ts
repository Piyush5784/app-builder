import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createErrorResponse } from "@/types/api-response";
import { SessionNotFoundError, SandboxNotCreatedError } from "@/agent/sandbox";
import { InsufficientCreditsError } from "@/agent/core/agent-runtime";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Domain errors thrown from agent/* that map to a specific HTTP status here,
// so route handlers don't each need their own try/catch translating them —
// see agent.routes.ts, which just lets these propagate to asyncHandler's
// .catch(next).
const domainErrorStatus = new Map<new (...args: never[]) => Error, number>([
  [SessionNotFoundError, 404],
  [SandboxNotCreatedError, 404],
  [InsufficientCreditsError, 402],
]);

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(handler: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(createErrorResponse(err.message));
  }

  if (err instanceof Error) {
    const status = domainErrorStatus.get(
      err.constructor as new (...args: never[]) => Error,
    );
    if (status !== undefined) {
      return res.status(status).json(createErrorResponse(err.message));
    }
  }

  console.error(err);
  return res.status(500).json(createErrorResponse("Internal server error"));
}
