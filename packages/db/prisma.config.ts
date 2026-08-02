// Prisma's own config loader doesn't inherit Bun's automatic .env loading —
// this needs to stay even though the rest of the codebase doesn't use dotenv.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "zenstack/generated/prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
