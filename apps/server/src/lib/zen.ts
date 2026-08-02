import { Pool } from "pg";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import { ZenStackClient } from "@zenstackhq/orm";
import { PolicyPlugin } from "@zenstackhq/plugin-policy";
import { schema } from "@package/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const zen = new ZenStackClient(schema, {
  dialect: new PostgresDialect({ pool }),
}).$use(new PolicyPlugin());

