import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isMutatingTool, type AgentEvent } from "@package/shared";
import { api } from "@/utils/axios";
import { useModelQuery } from "@/hooks/use-model-queries";
import type {
  ChatItem,
  FileResponse,
  FileTreeNode,
  ModelInfo,
  PersistedToolInvocation,
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

export type HistorySeedResult =
  | { status: "pending" }
  | { status: "empty" }
  | { status: "seeded"; items: ChatItem[]; isGenerating: boolean };

export function useHistorySeed(
  sessionId: string,
  runs: ReturnType<typeof useRunsQuery>["data"],
  invocations: PersistedToolInvocation[] | undefined,
): HistorySeedResult {
  const seededForRef = React.useRef<string | null>(null);
  const [result, setResult] = React.useState<HistorySeedResult>({
    status: "pending",
  });

  React.useEffect(() => {
    if (seededForRef.current === sessionId || !runs || !invocations) return;
    seededForRef.current = sessionId;

    if (runs.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: seededForRef guards this to run at most once per session, not a render-time derivation
      setResult({ status: "empty" });
      return;
    }
    setResult({
      status: "seeded",
      items: buildItemsFromRuns(runs, invocations),
      isGenerating: runs.some((run) => run.status === "running"),
    });
  }, [sessionId, runs, invocations]);

  return result;
}

export function useModelsQuery() {
  return useQuery({
    queryKey: ["agent-models"],
    queryFn: async () => {
      const res = await api.get<{ data: { models: ModelInfo[] } }>(
        "/agent/models",
      );
      return res.data.data.models;
    },
    staleTime: Infinity,
  });
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

export function useSaveFileMutation(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      path,
      content,
    }: {
      path: string;
      content: string;
    }) => {
      await api.put(`/agent/sandbox/${sessionId}/file`, { path, content });
    },
    onSuccess: (_data, { path }) => {
      queryClient.invalidateQueries({
        queryKey: ["agent-sandbox-file", sessionId, path],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-sandbox-files", sessionId],
      });
    },
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

export function useSendPrompt(
  sessionId: string | undefined,
  onEvent: (event: AgentEvent) => void,
) {
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const mutate = React.useCallback(
    (prompt: string, model?: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        onEvent({ type: "cancelled" });
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      streamPrompt({ prompt, sessionId, model }, onEvent, controller.signal)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          onEvent({
            type: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        });
    },
    [sessionId, onEvent],
  );

  return { mutate };
}

export function useCancelGeneration(sessionId: string) {
  return useMutation({
    mutationFn: async () => {
      await api.post(`/agent/sessions/${sessionId}/cancel`);
    },
  });
}

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
        case "session_ready": {
          break;
        }
        case "sandbox_ready": {
          queryClient.setQueryData(
            ["agent-sandbox", event.sessionId],
            (prev: SandboxResponse | undefined) => ({
              previewUrl: event.previewUrl,
              toolInvocations: prev?.toolInvocations ?? [],
            }),
          );
          break;
        }
        case "step_start": {
          break;
        }
        case "token": {
          const isNewMessage = !streamingIdRef.current;
          if (isNewMessage) streamingIdRef.current = crypto.randomUUID();
          const id = streamingIdRef.current!;

          setItems((prev) =>
            isNewMessage
              ? [...prev, { id, kind: "assistant", content: event.delta }]
              : prev.map((item) =>
                  item.id === id && item.kind === "assistant"
                    ? { ...item, content: item.content + event.delta }
                    : item,
                ),
          );
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
          if (event.success && isMutatingTool(event.tool)) {
            queryClient.invalidateQueries({
              queryKey: ["agent-sandbox-files", sessionId],
            });
          }
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
              {
                id: crypto.randomUUID(),
                kind: "assistant",
                content: event.reply,
              },
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
