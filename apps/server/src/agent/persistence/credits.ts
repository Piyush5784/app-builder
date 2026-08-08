import { prisma } from "@package/db";

/**
 * WHY:
 * The only non-CRUD file in this folder. Deducting credits is a single
 * atomic operation across two tables (User.credits + a CreditTransaction
 * audit row) — decomposing it into generic CRUD calls at the caller would
 * mean every caller re-implements the same `$transaction`, so it's wrapped
 * once here instead.
 *
 * CONTEXT:
 * User isn't an agent-owned table, so getUserCredits/deductCredits are the
 * one place this folder reaches into it — every other file here only touches
 * agent-owned tables.
 */
export const credits = {
  async getUserCredits(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user ? Number(user.credits) : 0;
  },

  // Every model is billed on actual token usage, only known after the LLM
  // call — so this is unconditional (there's no "reject" outcome once the
  // provider has already been paid for the call; the pre-call balance > 0
  // check in agent-runtime.ts is the only gate).
  async deductCredits(
    userId: string,
    runId: string,
    amount: number,
    description: string,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: amount } },
      }),
      prisma.creditTransaction.create({
        data: { userId, runId, amount: -amount, type: "usage", description },
      }),
    ]);
  },
};
