import { Redis } from "@upstash/redis";
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from "@/config";

/**
 * WHY:
 * Shared by both rate limiters — express-rate-limit's store (see
 * middleware/rate-limit.ts) and better-auth's secondaryStorage (see
 * lib/auth.ts). Without a shared store, each of those defaults to counting
 * in that one process's memory, so the effective limit silently multiplies
 * by however many server instances happen to be running.
 *
 * CONTEXT:
 * `@upstash/redis`'s default export (the Node build) is what belongs here —
 * this server is a long-running Bun/Express process, not a Cloudflare
 * Worker. The `@upstash/redis/cloudflare` entry point is a smaller,
 * Workers-isolate-specific build (no keep-alive connection reuse, some
 * command builders stripped out) meant for that runtime specifically; it's
 * what `apps/web`'s static build lives behind on Cloudflare Pages, but this
 * server isn't deployed there.
 *
 * Consumers only ever call the named methods below, never the underlying
 * client directly — same generic-wrapper shape as the DB layer
 * (agent/persistence/*).
 */
const client = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

export const redis = {
  getData: <TData = string>(key: string) => client.get<TData>(key),

  setData: (key: string, value: string, ttlSeconds?: number) =>
    client.set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined),

  deleteData: (key: string) => client.del(key),

  getAndDeleteData: <TData = string>(key: string) => client.getdel<TData>(key),

  async incrementData(key: string, ttlSeconds: number): Promise<number> {
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, ttlSeconds);
    return count;
  },

  decrementData: (key: string) => client.decr(key),

  ttlSeconds: (key: string) => client.ttl(key),
};
