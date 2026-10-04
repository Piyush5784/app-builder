import type { PoolConfig } from "pg";

export const POOL_CONFIG: { production: PoolConfig; development: PoolConfig } =
  {
    production: {
      max: 5,
      idleTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    },
    development: {
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    },
  } as const;
