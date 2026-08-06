import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentEvent } from "@package/shared";
import { api } from "@/utils/axios";
import { useModelQuery } from "@/hooks/use-model-queries";
import type {
  ChatItem,
  FileResponse,
  FileTreeNode,
  SandboxResponse,
} from "@/routes/dashboard/build/-types";
import { buildItemsFromRuns } from "@/routes/dashboard/build/-chat-history";
import { streamPrompt } from "@/routes/dashboard/build/-stream-prompt";

export function useRunsQuery(sessionId: string, enabled = true) {
  return useModelQuery("AgentRun").useFindMany(
    {
      where: { sessionId },
      orderBy: { startedAt: "asc" },
      select: {
        id: true,
        prompt: true,
        reply: true,
        status: true,
        errorMessage: true,
      },
    },
    { enabled },
  );
}

export function useToolInvocationsQuery(sessionId: string, enabled = true) {
  return useModelQuery("ToolInvocation").useFindMany(
    {
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
    },
    { enabled },
  );
}

export type HistorySeedResult =
  | { status: "pending" }
  | { status: "empty" }
  | { status: "seeded"; items: ChatItem[]; isGenerating: boolean };

export function useHistorySeed(
  runs: ReturnType<typeof useRunsQuery>["data"],
  invocations: ReturnType<typeof useToolInvocationsQuery>["data"],
): HistorySeedResult {
  const hasSeededRef = React.useRef(false);
  const [result, setResult] = React.useState<HistorySeedResult>({
    status: "pending",
  });

  React.useEffect(() => {
    if (hasSeededRef.current || !runs || !invocations) return;
    hasSeededRef.current = true;

    if (runs.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: hasSeededRef guards this to run at most once, not a render-time derivation
      setResult({ status: "empty" });
      return;
    }
    setResult({
      status: "seeded",
      items: buildItemsFromRuns(runs, invocations),
      isGenerating: runs.some((run) => run.status === "running"),
    });
  }, [runs, invocations]);

  return result;
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

export function useSandboxQuery(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ["agent-sandbox", sessionId],
    queryFn: async () => {
      const res = await api.get<{ data: SandboxResponse }>(
        `/agent/sandbox/${sessionId}`,
      );
      return res.data.data;
    },
    enabled,
  });
}

// Sends the prompt and reads the whole run's events off that one request.
// `sessionId` is optional — a brand-new session doesn't have one yet, the
// server generates it and reports it back on "sandbox_ready".
export function useSendPrompt(
  sessionId: string | undefined,
  onEvent: (event: AgentEvent) => void,
) {
  return useMutation({
    mutationFn: (prompt: string) => streamPrompt({ prompt, sessionId }, onEvent),
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

// Translates the prompt stream's AgentEvent sequence into `items`/
// `isGenerating` updates. Tokens accumulate into one "live" assistant
// bubble that "done" then overwrites with the authoritative final text.
export function useAgentEventHandler(
  sessionId: string,
  setItems: React.Dispatch<React.SetStateAction<ChatItem[]>>,
  setIsGenerating: (value: boolean) => void,
): (event: AgentEvent) => void {
  const queryClient = useQueryClient();
  const streamingIdRef = React.useRef<string | null>(null);

  return React.useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case "sandbox_ready": {
          queryClient.invalidateQueries({
            queryKey: ["agent-sandbox", event.sessionId],
          });
          break;
        }
        case "step_start": {
          break; // no UI effect — just marks loop progress
        }
        case "token": {
          setItems((prev) => {
            if (streamingIdRef.current) {
              return prev.map((item) =>
                item.id === streamingIdRef.current && item.kind === "assistant"
                  ? { ...item, content: item.content + event.delta }
                  : item,
              );
            }
            const id = crypto.randomUUID();
            streamingIdRef.current = id;
            return [
              ...prev,
              { id, kind: "assistant", content: event.delta },
            ];
          });
          break;
        }
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
          const streamingId = streamingIdRef.current;
          streamingIdRef.current = null;
          setItems((prev) => {
            if (streamingId) {
              return prev.map((item) =>
                item.id === streamingId
                  ? { ...item, content: event.reply }
                  : item,
              );
            }
            if (!event.reply) return prev;
            return [
              ...prev,
              { id: crypto.randomUUID(), kind: "assistant", content: event.reply },
            ];
          });
          queryClient.invalidateQueries({
            queryKey: ["agent-sandbox", sessionId],
          });
          break;
        }
        case "error": {
          setIsGenerating(false);
          const streamingId = streamingIdRef.current;
          streamingIdRef.current = null;
          setItems((prev) => [
            ...prev.filter((item) => item.id !== streamingId),
            { id: crypto.randomUUID(), kind: "error", content: event.message },
          ]);
          break;
        }
        case "cancelled": {
          setIsGenerating(false);
          const streamingId = streamingIdRef.current;
          streamingIdRef.current = null;
          setItems((prev) => [
            ...prev
              .filter((item) => item.id !== streamingId)
              .map((item) =>
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
