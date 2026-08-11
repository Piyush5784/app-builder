import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, IS_PRODUCTION } from "./config";
import { POOL_CONFIG } from "./pool-config";

const adapter = IS_PRODUCTION
  ? new PrismaNeon({
      connectionString: DATABASE_URL,
      ...POOL_CONFIG.production,
    })
  : new PrismaPg({
      connectionString: DATABASE_URL,
      ...POOL_CONFIG.development,
    });

export const prisma = new PrismaClient({ adapter });
