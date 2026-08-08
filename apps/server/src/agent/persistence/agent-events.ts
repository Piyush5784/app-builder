import { prisma } from "@package/db";

export const agentEvents = {
  create: (args: Parameters<typeof prisma.agentEvent.create>[0]) =>
    prisma.agentEvent.create(args),
};
