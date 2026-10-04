import { agentSessions } from "@/agent/persistence/agent-sessions";
import { agentRuns } from "@/agent/persistence/agent-runs";
import { messages } from "@/agent/persistence/messages";
import { llmCalls } from "@/agent/persistence/llm-calls";
import { agentEvents } from "@/agent/persistence/agent-events";
import { toolInvocations } from "@/agent/persistence/tool-invocations";
import { modelPricing } from "@/agent/persistence/model-pricing";
import { credits } from "@/agent/persistence/credits";

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
