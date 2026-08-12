import { createSandboxGuardrail } from "@/agent/guardrails/sandbox-guardrail";

/**
 * Guardrails are safety nets that don't depend on the model doing anything
 * right — they wrap the infrastructure the model's tools run against, so a
 * missed step never becomes a broken run. `createSandboxGuardrail` is the
 * first one: it makes sandbox provisioning automatic and lazy instead of a
 * step the model could skip. Future guardrails (rate limits on tool calls,
 * output size caps, etc.) belong here too, one file per guardrail.
 */
export const guardrails = { createSandboxGuardrail };
export type { SandboxState } from "@/agent/guardrails/sandbox-guardrail";
