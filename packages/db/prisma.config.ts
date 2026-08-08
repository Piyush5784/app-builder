import "dotenv/config";
import { defineConfig } from "prisma/config";
import { DATABASE_URL } from "./src/config";

export default defineConfig({
  schema: "zenstack/generated/prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
