export {
  getOrCreateSandbox,
  getPreviewUrl,
  updateSession,
  destroySandbox,
  SessionNotFoundError,
  openSandbox,
  getSandboxUrl,
  listSandboxFiles,
  readSandboxFile,
  downloadSandboxZip,
} from "@/agent/sandbox/manager";
export type { SandboxHandle } from "@/agent/sandbox/manager";
export { buildFileTree } from "@/agent/sandbox/file-tree";
export type { FileTreeNode } from "@/agent/sandbox/file-tree";
