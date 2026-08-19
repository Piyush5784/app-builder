import { prisma } from "../src/prisma";

const PRICES: {
  provider: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}[] = [
  {
    provider: "nvidia",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    inputPricePerMillion: 0.6,
    outputPricePerMillion: 1.8,
  },
  {
    provider: "nvidiaLightning",
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
  },
  {
    provider: "gemini",
    model: "gemini-2.0-flash-exp",
    inputPricePerMillion: 0.1,
    outputPricePerMillion: 0.4,
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
  },
  {
    provider: "openai",
    model: "gpt-4o-mini",
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
  },
  {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
  },
];

async function main() {
  console.log("💰 Seeding model pricing...");

  const now = new Date();
  let created = 0;

  for (const price of PRICES) {
    const existing = await prisma.modelPricing.findFirst({
      where: {
        provider: price.provider,
        model: price.model,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
    });
    if (existing) continue;

    await prisma.modelPricing.create({ data: price });
    created++;
  }

  console.log(
    `✅ Created ${created} pricing row(s), ${PRICES.length - created} already up to date`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
