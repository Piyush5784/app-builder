import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentEvent } from "@package/shared";
import { api } from "@/utils/axios";
import { useModelQuery } from "@/hooks/use-model-queries";
import type {
  ChatItem,
  FileResponse,
  FileTreeNode,
  PromptResponse,
  SandboxResponse,
} from "@/routes/dashboard/build/-types";
import { buildItemsFromRuns } from "@/routes/dashboard/build/-chat-history";

export function useRunsQuery(sessionId: string) {
  return useModelQuery("AgentRun").useFindMany({
    where: { sessionId },
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      prompt: true,
      reply: true,
      status: true,
      errorMessage: true,
    },
  });
}

export function useToolInvocationsQuery(sessionId: string) {
  return useModelQuery("ToolInvocation").useFindMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      runId: true,
      toolName: true,
      arguments: true,
      status: true,
      createdAt: true,
    },
  });
}

// Seeds chat state from the query cache exactly once, the moment both
// queries resolve — done during render (not an effect) so it applies before
// the first paint instead of costing an extra render+commit. After the first
// seed, `items`/`isGenerating` are owned entirely by live socket events, so
// this must never re-run on a refetch.
export function useHistorySeed(
  runs: ReturnType<typeof useRunsQuery>["data"],
  invocations: ReturnType<typeof useToolInvocationsQuery>["data"],
  onSeed: (items: ChatItem[], isGenerating: boolean) => void,
): void {
  const [hasSeeded, setHasSeeded] = React.useState(false);

  if (!hasSeeded && runs && invocations) {
    setHasSeeded(true);
    if (runs.length > 0) {
      onSeed(
        buildItemsFromRuns(runs, invocations),
        runs.some((run) => run.status === "running"),
      );
    }
  }
}

export function useFilesQuery(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["agent-sandbox-files", sessionId],
    queryFn: async () => {
      const res = await api.get<{ data: FileTreeNode[] }>(
        `/agent/sandbox/${sessionId}/files`,
      );
      return res.data.data;
    },
    enabled,
  });
}

export function useFileQuery(
  sessionId: string,
  selectedPath: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["agent-sandbox-file", sessionId, selectedPath],
    queryFn: async () => {
      const res = await api.get<{ data: FileResponse }>(
        `/agent/sandbox/${sessionId}/file`,
        { params: { path: selectedPath } },
      );
      return res.data.data;
    },
    enabled,
  });
}

export function useSandboxQuery(sessionId: string) {
  return useQuery({
    queryKey: ["agent-sandbox", sessionId],
    queryFn: async () => {
      const res = await api.get<{ data: SandboxResponse }>(
        `/agent/sandbox/${sessionId}`,
      );
      return res.data.data;
    },
  });
}

export function useSendPrompt(sessionId: string, onSent: () => void) {
  return useMutation({
    mutationFn: async (value: string) => {
      const res = await api.post<{ data: PromptResponse }>("/agent/prompt", {
        prompt: value,
        sessionId,
      });
      return res.data.data;
    },
    onSuccess: onSent,
  });
}

export function useCancelGeneration(sessionId: string) {
  return useMutation({
    mutationFn: async () => {
      await api.post(`/agent/sessions/${sessionId}/cancel`);
    },
  });
}

// Escape stops generation regardless of what's focused — matches the Stop
// button's behavior without requiring the textarea to have focus.
export function useCancelOnEscape(
  isGenerating: boolean,
  onCancel: () => void,
): void {
  React.useEffect(() => {
    if (!isGenerating) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGenerating, onCancel]);
}

// Translates the socket's AgentEvent stream into `items`/`isGenerating`
// updates for the chat pane.
export function useAgentEventHandler(
  sessionId: string,
  setItems: React.Dispatch<React.SetStateAction<ChatItem[]>>,
  setIsGenerating: (value: boolean) => void,
): (event: AgentEvent) => void {
  const queryClient = useQueryClient();

  return React.useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case "tool_start": {
          setItems((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              kind: "activity",
              activity: {
                id: crypto.randomUUID(),
                step: event.step,
                tool: event.tool,
                args: event.args,
                status: "pending",
              },
            },
          ]);
          break;
        }
        case "tool_end": {
          setItems((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              const item = next[i];
              if (
                item.kind === "activity" &&
                item.activity.step === event.step &&
                item.activity.tool === event.tool &&
                item.activity.status === "pending"
              ) {
                next[i] = {
                  ...item,
                  activity: {
                    ...item.activity,
                    status: event.success ? "success" : "error",
                  },
                };
                break;
              }
            }
            return next;
          });
          break;
        }
        case "done": {
          setIsGenerating(false);
          if (event.reply) {
            setItems((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                kind: "assistant",
                content: event.reply,
              },
            ]);
          }
          queryClient.invalidateQueries({
            queryKey: ["agent-sandbox", sessionId],
          });
          break;
        }
        case "error": {
          setIsGenerating(false);
          setItems((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              kind: "error",
              content: event.message,
            },
          ]);
          break;
        }
        case "cancelled": {
          setIsGenerating(false);
          setItems((prev) => [
            ...prev.map((item) =>
              item.kind === "activity" && item.activity.status === "pending"
                ? {
                    ...item,
                    activity: { ...item.activity, status: "error" as const },
                  }
                : item,
            ),
            {
              id: crypto.randomUUID(),
              kind: "assistant",
              content: "Generation stopped.",
            },
          ]);
          break;
        }
      }
    },
    [sessionId, queryClient, setItems, setIsGenerating],
  );
}
