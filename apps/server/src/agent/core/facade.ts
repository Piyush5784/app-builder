import { runAgent, type AgentResult } from "@/agent/core/agent-runtime";
import { cancellation } from "@/agent/core/cancellation";
import { sandbox } from "@/agent/sandbox";

export const core = {
  runAgent,
  cancelRun: cancellation.cancelRun,
  getSandboxUrl: sandbox.manager.getSandboxUrl,
  listSandboxFiles: sandbox.manager.listSandboxFiles,
  readSandboxFile: sandbox.manager.readSandboxFile,
  downloadSandboxZip: sandbox.manager.downloadSandboxZip,
};
export type { AgentResult };
