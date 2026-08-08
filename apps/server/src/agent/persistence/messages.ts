import { prisma } from "@package/db";

export const messages = {
  findMany: (args: Parameters<typeof prisma.message.findMany>[0]) =>
    prisma.message.findMany(args),
  count: (args: Parameters<typeof prisma.message.count>[0]) =>
    prisma.message.count(args),
  createMany: (args: Parameters<typeof prisma.message.createMany>[0]) =>
    prisma.message.createMany(args),
};
