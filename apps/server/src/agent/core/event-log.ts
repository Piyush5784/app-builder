import type { ToolCall } from "@/agent/types";
import { MUTATING_TOOLS } from "@package/shared";
import { listMutatingToolInvocations } from "@/agent/persistence";

export async function getEvents(sessionId: string): Promise<ToolCall[]> {
  return listMutatingToolInvocations(sessionId, [...MUTATING_TOOLS]);
}
