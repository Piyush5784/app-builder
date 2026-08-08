import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import { DATABASE_URL, IS_PRODUCTION } from "./config";

export const pgPool: PgPool = IS_PRODUCTION
  ? (new NeonPool({ connectionString: DATABASE_URL }) as unknown as PgPool)
  : new PgPool({ connectionString: DATABASE_URL });
