import rateLimit, {
  type Store,
  type ClientRateLimitInfo,
} from "express-rate-limit";
import { NODE_ENV } from "@/config";
import { redis } from "@/lib/redis";

const skipInDev = () => NODE_ENV === "development";

/**
 * WHY:
 * A shared Redis-backed Store so the hit count is correct across more than
 * one server process — express-rate-limit's default MemoryStore counts
 * per-process, so with N instances the effective limit silently becomes N
 * times the configured one.
 *
 * CONTEXT:
 * Fixed-window counting (INCR + EXPIRE-on-first-hit), same algorithm the
 * in-memory default already used, just shared now. `prefix` keeps each
 * limiter's keys from colliding with the other's in the same Redis instance
 * — normalLimiter and strictLimiter would otherwise count against the same
 * key for a given client (default keyGenerator is just the client IP).
 */
function createRedisStore(prefix: string, windowMs: number): Store {
  const windowSeconds = Math.ceil(windowMs / 1000);

  return {
    async increment(key): Promise<ClientRateLimitInfo> {
      const storeKey = `${prefix}${key}`;
      const totalHits = await redis.incrementData(storeKey, windowSeconds);
      const remainingTtl = await redis.ttlSeconds(storeKey);
      return {
        totalHits,
        resetTime:
          remainingTtl > 0
            ? new Date(Date.now() + remainingTtl * 1000)
            : undefined,
      };
    },
    async decrement(key) {
      await redis.decrementData(`${prefix}${key}`);
    },
    async resetKey(key) {
      await redis.deleteData(`${prefix}${key}`);
    },
  };
}

export const normalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 50,
  skip: skipInDev,
  store: createRedisStore("rl:normal:", 60 * 1000),
  message: {
    error: "Too many requests, please try again later.",
    success: false,
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  skip: skipInDev,
  store: createRedisStore("rl:strict:", 60 * 1000),
  message: {
    error: "Too many login attempts, please try again later.",
    success: false,
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
