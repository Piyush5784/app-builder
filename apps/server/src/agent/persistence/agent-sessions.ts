import { prisma } from "@package/db";

export const agentSessions = {
  findUnique: (args: Parameters<typeof prisma.agentSession.findUnique>[0]) =>
    prisma.agentSession.findUnique(args),
  upsert: (args: Parameters<typeof prisma.agentSession.upsert>[0]) =>
    prisma.agentSession.upsert(args),
  updateMany: (args: Parameters<typeof prisma.agentSession.updateMany>[0]) =>
    prisma.agentSession.updateMany(args),
  deleteMany: (args: Parameters<typeof prisma.agentSession.deleteMany>[0]) =>
    prisma.agentSession.deleteMany(args),
};
