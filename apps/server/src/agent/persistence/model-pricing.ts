import { prisma } from "@package/db";

export const modelPricing = {
  findFirst: (args: Parameters<typeof prisma.modelPricing.findFirst>[0]) =>
    prisma.modelPricing.findFirst(args),
};
