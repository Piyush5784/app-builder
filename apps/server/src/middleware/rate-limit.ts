import rateLimit from "express-rate-limit";
import { NODE_ENV } from "@/config";

const skipInDev = () => NODE_ENV === "development";

// 30 requests per minute
export const normalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 50,
  skip: skipInDev,
  message: {
    error: "Too many requests, please try again later.",
    success: false,
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// 5 requests per minute
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  skip: skipInDev,
  message: {
    error: "Too many login attempts, please try again later.",
    success: false,
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
