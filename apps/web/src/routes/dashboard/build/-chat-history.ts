import type { ToolName } from "@package/shared";
import type {
  ChatItem,
  PersistedRun,
  PersistedToolInvocation,
} from "@/routes/dashboard/build/-types";

export function buildItemsFromRuns(
  runs: PersistedRun[],
  invocations: PersistedToolInvocation[],
): ChatItem[] {
  const items: ChatItem[] = [];
  for (const run of runs) {
    items.push({ id: `${run.id}-user`, kind: "user", content: run.prompt });

    for (const invocation of invocations) {
      if (invocation.runId !== run.id) continue;
      items.push({
        id: `${invocation.id}-activity`,
        kind: "activity",
        activity: {
          id: invocation.id,
          step: 0,
          tool: invocation.toolName as ToolName,
          args: invocation.arguments,
          status: invocation.status === "failed" ? "error" : "success",
        },
      });
    }

    if (run.reply) {
      items.push({
        id: `${run.id}-assistant`,
        kind: "assistant",
        content: run.reply,
      });
    } else if (run.status === "failed") {
      items.push({
        id: `${run.id}-error`,
        kind: "error",
        content: run.errorMessage ?? "This run failed.",
      });
    }
  }
  return items;
}
