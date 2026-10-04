import { Redis } from "@upstash/redis";
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from "@/config";

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
