import { prisma } from "@package/db";
import type { ToolCall } from "@/agent/types";

export interface CreateToolInvocationParams {
  sessionId: string;
  llmCallId: string;
  call: ToolCall;
  output: string;
  success: boolean;
  durationMs: number;
}

export async function createToolInvocation(params: CreateToolInvocationParams): Promise<void> {
  await prisma.toolInvocation.create({
    data: {
      sessionId: params.sessionId,
      llmCallId: params.llmCallId,
      toolName: params.call.name,
      arguments: params.call.arguments as never,
      output: params.output,
      status: params.success ? "success" : "failed",
      errorMessage: params.success ? undefined : params.output,
      durationMs: params.durationMs,
    },
  });
}
