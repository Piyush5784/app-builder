import { agentSessions } from "@/agent/persistence/agent-sessions";
import { agentRuns } from "@/agent/persistence/agent-runs";
import { messages } from "@/agent/persistence/messages";
import { llmCalls } from "@/agent/persistence/llm-calls";
import { agentEvents } from "@/agent/persistence/agent-events";
import { toolInvocations } from "@/agent/persistence/tool-invocations";
import { modelPricing } from "@/agent/persistence/model-pricing";
import { credits } from "@/agent/persistence/credits";

/**
 * WHY:
 * One namespace per agent-owned Prisma model, each exposing only generic
 * CRUD/count methods (create, update, findFirst, findMany, count, ...) that
 * take Prisma's own args shape directly — callers read as
 * `persistence.agentSessions.findUnique(...)`, `persistence.credits.deductCredits(...)`.
 * No business-specific helpers beyond `credits` (see its own file for why
 * that one stays a named function).
 *
 * CONTEXT:
 * Sequencing and cross-table logic (role mapping, ownership checks, name
 * truncation, credit-amount math) lives in the calling "primary function"
 * (agent-runtime.ts, agent.routes.ts, cancellation.ts, ...), not here.
 * Only tables the agent domain owns get a file here — User/Account/Session
 * are auth tables and get queried directly via `prisma` at the call site.
 */
export const persistence = {
  agentSessions,
  agentRuns,
  messages,
  llmCalls,
  agentEvents,
  toolInvocations,
  modelPricing,
  credits,
};
