import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createErrorResponse } from "@/types/api-response";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

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

  console.error(err);
  return res.status(500).json(createErrorResponse("Internal server error"));
}
