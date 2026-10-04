import type { Sandbox } from "e2b";
import { sandbox } from "@/agent/sandbox";
import type { AgentEvent } from "@package/shared";

export interface SandboxState {
  sandbox: Sandbox;
  previewUrl: string;
}

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
