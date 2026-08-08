import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import { ZenStackClient } from "@zenstackhq/orm";
import { PolicyPlugin } from "@zenstackhq/plugin-policy";
import { schema } from "@package/db/schema";
import { pgPool } from "@package/db";

export const zen = new ZenStackClient(schema, {
  dialect: new PostgresDialect({ pool: pgPool }),
}).$use(new PolicyPlugin());
