import { prisma } from "@package/db";

export const agentRuns = {
  create: (args: Parameters<typeof prisma.agentRun.create>[0]) =>
    prisma.agentRun.create(args),
  update: (args: Parameters<typeof prisma.agentRun.update>[0]) =>
    prisma.agentRun.update(args),
  findFirst: (args: Parameters<typeof prisma.agentRun.findFirst>[0]) =>
    prisma.agentRun.findFirst(args),
  findUnique: (args: Parameters<typeof prisma.agentRun.findUnique>[0]) =>
    prisma.agentRun.findUnique(args),
};
