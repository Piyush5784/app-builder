import {
  manager,
  SessionNotFoundError,
  SandboxNotCreatedError,
} from "@/agent/sandbox/manager";
import { fileTree } from "@/agent/sandbox/file-tree";

export const sandbox = { manager, fileTree };
export { SessionNotFoundError, SandboxNotCreatedError };
export type { SandboxHandle } from "@/agent/sandbox/manager";
export type { FileTreeNode } from "@/agent/sandbox/file-tree";
