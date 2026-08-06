import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, IS_PRODUCTION } from "./config";

const adapter = IS_PRODUCTION
  ? new PrismaNeon({ connectionString: DATABASE_URL })
  : new PrismaPg({ connectionString: DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
