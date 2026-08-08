import { core } from "@/agent/core/facade";
import { persistence } from "@/agent/persistence";
import { sandbox } from "@/agent/sandbox";
import { providers } from "@/agent/providers";
import { toolsModule } from "@/agent/tools";
import { telemetry } from "@/agent/telemetry";
import { models } from "@/agent/models";

export type { AgentResult } from "@/agent/core/facade";
export type { ProviderName } from "@/agent/providers";
export type { FileTreeNode } from "@/agent/sandbox";
export type { ModelOption } from "@/agent/models";

/**
 * WHY:
 * Single entry point for every agent subsystem, one namespace per subfolder
 * (agent.core, agent.persistence, agent.sandbox, agent.providers, agent.tools,
 * agent.telemetry, agent.models) — callers read as
 * `agent.core.runAgent(...)`, `agent.persistence.credits.deductCredits(...)`,
 * `agent.sandbox.manager.getOrCreateSandbox(...)`.
 */
export const agent = {
  core,
  persistence,
  sandbox,
  providers,
  tools: toolsModule,
  telemetry,
  models,
};
