import { prisma } from "@package/db";

export const toolInvocations = {
  create: (args: Parameters<typeof prisma.toolInvocation.create>[0]) =>
    prisma.toolInvocation.create(args),
  findMany: (args: Parameters<typeof prisma.toolInvocation.findMany>[0]) =>
    prisma.toolInvocation.findMany(args),
};
