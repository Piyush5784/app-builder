import type { ToolName } from "@package/shared";

export interface SandboxResponse {
  previewUrl: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  tier: "free" | "paid";
}

export interface FileTreeNode {
  path: string;
  name: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
}

export interface FileResponse {
  path: string;
  content: string;
}

export interface ActivityEntry {
  id: string;
  step: number;
  tool: ToolName;
  args: unknown;
  status: "pending" | "success" | "error";
}

export type ChatItem =
  | { id: string; kind: "user" | "assistant" | "error"; content: string }
  | { id: string; kind: "activity"; activity: ActivityEntry };

export interface PersistedRun {
  id: string;
  prompt: string;
  reply: string | null;
  status: "running" | "success" | "failed";
  errorMessage: string | null;
}

export interface PersistedToolInvocation {
  id: string;
  runId: string;
  toolName: string;
  arguments: unknown;
  status: "running" | "success" | "failed";
  createdAt: Date;
}
