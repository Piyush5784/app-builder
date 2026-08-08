// One-off backfill: sessions created before the "first prompt becomes the
// name" feature existed still have `name: null`, showing as "Session
// <id-prefix>" in the sidebar. This fills them in from each session's
// earliest AgentRun prompt, same truncation rule as new sessions get.
//
// Run from apps/server: bun run src/scripts/backfill-session-names.ts
import { prisma } from "@package/db";
import { agent } from "@/agent";

const MAX_SESSION_NAME_LENGTH = 100;

function truncateSessionName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= MAX_SESSION_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_SESSION_NAME_LENGTH)}…`;
}

async function main() {
  const unnamed = await prisma.agentSession.findMany({
    where: { name: null },
    select: { id: true },
  });

  console.log(`Found ${unnamed.length} unnamed session(s).`);

  let updated = 0;
  for (const session of unnamed) {
    const firstRun = await agent.persistence.agentRuns.findFirst({
      where: { sessionId: session.id },
      orderBy: { startedAt: "asc" },
      select: { prompt: true },
    });

    if (!firstRun) continue;

    await agent.persistence.agentSessions.updateMany({
      where: { id: session.id },
      data: { name: truncateSessionName(firstRun.prompt) },
    });
    updated++;
  }

  console.log(`Updated ${updated} session name(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
