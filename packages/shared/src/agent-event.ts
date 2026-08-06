import type { ToolName } from "./tool-name";

export type AgentEvent =
  | { type: "sandbox_ready"; sessionId: string; previewUrl: string }
  | { type: "token"; delta: string }
  | { type: "step_start"; step: number }
  | { type: "tool_start"; step: number; tool: ToolName; args: unknown }
  | {
      type: "tool_end";
      step: number;
      tool: ToolName;
      success: boolean;
      output: string;
    }
  | { type: "done"; reply: string }
  | { type: "error"; message: string }
  | { type: "cancelled" };
