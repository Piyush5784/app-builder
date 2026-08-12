import type { Sandbox } from "e2b";
import { sandbox } from "@/agent/sandbox";
import type { AgentEvent } from "@package/shared";

export interface SandboxState {
  sandbox: Sandbox;
  previewUrl: string;
}

/**
 * WHY:
 * Every real tool the model can call (writeFile, readFile, runCommand,
 * listFiles, ...) needs a live E2B sandbox to run against, but the model
 * is never given a separate "create sandbox" tool to call — provisioning
 * happens transparently, inside this wrapper, the first time any real
 * tool actually executes. That's the guardrail: there's no explicit step
 * for the model to forget, because there's no model-visible step at all.
 * A purely conversational reply ("how are you?") never calls
 * ensureSandbox and never pays the cost of spinning one up; the moment
 * the model calls any tool that touches the filesystem or runs a
 * command, that call routes through here first, and a sandbox is
 * guaranteed to exist by the time the tool body actually runs.
 *
 * CONTEXT:
 * One guardrail instance per run (see agent-runtime.ts), so the state
 * below is memoized for that run's lifetime — the first tool call pays
 * the cost of opening (or reconnecting to) the sandbox, every call after
 * that in the same run reuses the same handle instead of reopening it.
 * `sandbox_ready` fires exactly once, at the moment the sandbox actually
 * comes up — not before, and not at all for a run that never needs one.
 */
export function createSandboxGuardrail(
  sessionId: string,
  userId: string,
  emit: (event: AgentEvent) => void,
) {
  let state: SandboxState | null = null;

  async function ensureSandbox(): Promise<SandboxState> {
    if (state) return state;
    state = await sandbox.manager.openSandbox(sessionId, true, userId);
    emit({ type: "sandbox_ready", sessionId, previewUrl: state.previewUrl });
    return state;
  }

  function getState(): SandboxState | null {
    return state;
  }

  return { ensureSandbox, getState };
}
