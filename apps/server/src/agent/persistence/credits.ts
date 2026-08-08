import { prisma } from "@package/db";

export async function getUserCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user ? Number(user.credits) : 0;
}

export async function deductCredits(
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
}
