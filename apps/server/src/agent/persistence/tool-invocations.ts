import { prisma } from "@package/db";
import type { ToolCall, ToolName } from "@/agent/types";

export interface CreateToolInvocationParams {
  sessionId: string;
  runId: string;
  llmCallId: string;
  call: ToolCall;
  output: string;
  success: boolean;
  durationMs: number;
}

export async function createToolInvocation(
  params: CreateToolInvocationParams,
): Promise<void> {
  await prisma.toolInvocation.create({
    data: {
      sessionId: params.sessionId,
      runId: params.runId,
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

// Only the given (mutating) tool names' successful calls, oldest first — not
// every invocation. Used to replay a session's file/command changes onto a
// fresh sandbox, so reads/failed calls are filtered out at the query itself.
export async function listMutatingToolInvocations(
  sessionId: string,
  toolNames: ToolName[],
): Promise<ToolCall[]> {
  const rows = await prisma.toolInvocation.findMany({
    where: { sessionId, status: "success", toolName: { in: toolNames } },
    orderBy: { createdAt: "asc" },
    select: { id: true, toolName: true, arguments: true },
  });
  return rows.map(
    (row) =>
      ({
        id: row.id,
        name: row.toolName,
        arguments: row.arguments,
      }) as unknown as ToolCall,
  );
}
