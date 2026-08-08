import { prisma } from "@package/db";

export const llmCalls = {
  create: (args: Parameters<typeof prisma.lLMCall.create>[0]) =>
    prisma.lLMCall.create(args),
};
