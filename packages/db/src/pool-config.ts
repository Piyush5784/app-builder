import type { PoolConfig } from "pg";

/**
 * WHY:
 * Neither pool.ts (ZenStack's pool) nor prisma.ts (better-auth's adapter)
 * had any connection-pool sizing configured — both just opened a pool with
 * an unbounded default `max`. Shared here so the two pools stay consistent
 * instead of drifting to different numbers by accident.
 *
 * CONTEXT:
 * Production keeps `max` small and exits idle connections quickly —
 * multiple server instances (or serverless) can exist at once, so a big
 * pool per instance multiplies fast and Neon's own pooler is what actually
 * absorbs the real fan-out, not a big pool on our side. Dev keeps a larger,
 * longer-lived pool since there's only ever one process talking to the
 * local DB, and adds connectionTimeoutMillis (not a valid Neon pool option)
 * to fail fast if the local DB isn't up instead of hanging.
 */
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
