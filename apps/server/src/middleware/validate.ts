import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";
import { treeifyError } from "zod";

export function validate<T>(schema: ZodType<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: treeifyError(result.error), success: false });
      return;
    }
    req.body = result.data as Record<string, unknown>;
    next();
  };
}
