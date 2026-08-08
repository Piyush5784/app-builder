import { manager, SessionNotFoundError } from "@/agent/sandbox/manager";
import { fileTree } from "@/agent/sandbox/file-tree";

export const sandbox = { manager, fileTree };
export { SessionNotFoundError };
export type { SandboxHandle } from "@/agent/sandbox/manager";
export type { FileTreeNode } from "@/agent/sandbox/file-tree";
