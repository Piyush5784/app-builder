import { prisma } from "@package/db";

export interface ModelPricingRow {
  id: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

export async function getModelPricing(
  provider: string,
  model: string,
): Promise<ModelPricingRow | null> {
  const now = new Date();
  const row = await prisma.modelPricing.findFirst({
    where: {
      provider,
      model,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
    select: {
      id: true,
      inputPricePerMillion: true,
      outputPricePerMillion: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    inputPricePerMillion: Number(row.inputPricePerMillion),
    outputPricePerMillion: Number(row.outputPricePerMillion),
  };
}
