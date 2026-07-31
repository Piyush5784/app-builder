import type { ToolCall, ToolName } from "@/agent/types";

// Only these mutate sandbox state — readFile/listFiles are pure reads and
// never need replaying.
const MUTATING_TOOLS = new Set<ToolName>(["writeFile", "editFile", "deleteFile", "runCommand"]);

export function isMutatingTool(name: ToolName): boolean {
  return MUTATING_TOOLS.has(name);
}

// In-memory for now. Swap this Map for a real table later (session_id, seq,
// tool_call jsonb) — recordEvent/getEvents/clearEvents are the only surface
// callers touch, so that swap stays contained to this file.
const eventLogs = new Map<string, ToolCall[]>();

export function recordEvent(sessionId: string, call: ToolCall): void {
  const log = eventLogs.get(sessionId) ?? [];
  log.push(call);
  eventLogs.set(sessionId, log);
}

export function getEvents(sessionId: string): ToolCall[] {
  return eventLogs.get(sessionId) ?? [];
}

export function clearEvents(sessionId: string): void {
  eventLogs.delete(sessionId);
}
