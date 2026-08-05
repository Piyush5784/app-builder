import type { ToolCall, ToolName } from "@/agent/types";
import { createSandboxEvent, listSandboxEvents } from "@/agent/persistence";

// Only these mutate sandbox state — readFile/listFiles are pure reads and
// never need replaying.
const MUTATING_TOOLS = new Set<ToolName>([
  "writeFile",
  "editFile",
  "deleteFile",
  "runCommand",
]);

export function isMutatingTool(name: ToolName): boolean {
  return MUTATING_TOOLS.has(name);
}

export async function recordEvent(
  sessionId: string,
  call: ToolCall,
): Promise<void> {
  await createSandboxEvent(sessionId, call);
}

export async function getEvents(sessionId: string): Promise<ToolCall[]> {
  return listSandboxEvents(sessionId);
}
