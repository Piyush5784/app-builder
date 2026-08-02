
import type { ToolName } from "@package/shared";
export type { ToolName };

export type Role = "system" | "user" | "assistant" | "tool";

export interface WriteFileArgs {
  path: string;
  content: string;
}

export interface EditFileArgs {
  path: string;
  oldString: string;
  newString: string;
}

export interface ReadFileArgs {
  path: string;
}

export interface DeleteFileArgs {
  path: string;
}

export interface ListFilesArgs {
  path?: string;
}

export interface RunCommandArgs {
  command: string;
}

export type ToolCall =
  | { id: string; name: "writeFile"; arguments: WriteFileArgs }
  | { id: string; name: "editFile"; arguments: EditFileArgs }
  | { id: string; name: "readFile"; arguments: ReadFileArgs }
  | { id: string; name: "deleteFile"; arguments: DeleteFileArgs }
  | { id: string; name: "listFiles"; arguments: ListFilesArgs }
  | { id: string; name: "runCommand"; arguments: RunCommandArgs };

export interface ChatMessage {
  role: Role;
  content: string | null;
  toolCalls?: ToolCall[]; // set on assistant messages that call tools
  toolCallId?: string; // set on tool result messages
  name?: ToolName; // tool name, set on tool result messages
}

export interface ToolSchema {
  name: ToolName;
  description: string;
  // JSON-schema describing the tool to the LLM — inherently heterogeneous per-property,
  // so this stays loose. The actual runtime arguments are typed above via ToolCall.
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface ProviderResponse {
  content: string | null;
  toolCalls: ToolCall[];
  // Not every provider response includes usage data — stays optional rather
  // than defaulting to 0, so "unknown" and "used zero tokens" aren't conflated.
  tokensIn?: number;
  tokensOut?: number;
}

export interface LLMProvider {
  readonly providerLabel: string;
  readonly model: string;
  chat(messages: ChatMessage[], tools: ToolSchema[]): Promise<ProviderResponse>;
}

/**
 * Single typed boundary between "raw JSON args from the model" and the rest of the app.
 * Every provider must go through this so nothing downstream touches `any`.
 */
export function toToolCall(id: string, name: string, rawArgs: Record<string, unknown>): ToolCall {
  switch (name as ToolName) {
    case "writeFile":
      return { id, name: "writeFile", arguments: { path: String(rawArgs.path), content: String(rawArgs.content) } };
    case "editFile":
      return {
        id,
        name: "editFile",
        arguments: {
          path: String(rawArgs.path),
          oldString: String(rawArgs.oldString),
          newString: String(rawArgs.newString),
        },
      };
    case "readFile":
      return { id, name: "readFile", arguments: { path: String(rawArgs.path) } };
    case "deleteFile":
      return { id, name: "deleteFile", arguments: { path: String(rawArgs.path) } };
    case "listFiles":
      return { id, name: "listFiles", arguments: { path: rawArgs.path ? String(rawArgs.path) : undefined } };
    case "runCommand":
      return { id, name: "runCommand", arguments: { command: String(rawArgs.command) } };
    default:
      throw new Error(`Unknown tool call from model: ${name}`);
  }
}
