import * as React from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AgentEvent, ToolName } from "@package/shared";
import { api } from "@/utils/axios";
import { useAgentEvents } from "@/hooks/use-agent-events";
import { Textarea } from "@package/ui/components/textarea";
import { Button } from "@package/ui/components/button";
import { Spinner } from "@package/ui/components/spinner";
import {
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@package/ui/components/message-scroller";
import { Message, MessageContent } from "@package/ui/components/message";
import { Bubble, BubbleContent } from "@package/ui/components/bubble";
import {
  ArrowUpIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  FilePlus2Icon,
  FileEditIcon,
  FileTextIcon,
  Trash2Icon,
  FolderTreeIcon,
  TerminalIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

interface SandboxResponse {
  previewUrl: string;
}

interface PromptResponse {
  sessionId: string;
  previewUrl: string;
}

interface ActivityEntry {
  id: string;
  step: number;
  tool: ToolName;
  args: unknown;
  status: "pending" | "success" | "error";
}

type ChatItem =
  | { id: string; kind: "user" | "assistant" | "error"; content: string }
  | { id: string; kind: "activity"; activity: ActivityEntry };

const TOOL_ICON: Record<ToolName, React.ComponentType<{ className?: string }>> = {
  writeFile: FilePlus2Icon,
  editFile: FileEditIcon,
  readFile: FileTextIcon,
  deleteFile: Trash2Icon,
  listFiles: FolderTreeIcon,
  runCommand: TerminalIcon,
};

function toolLabel(tool: ToolName, args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  switch (tool) {
    case "writeFile":
      return `Writing ${String(a.path ?? "")}`;
    case "editFile":
      return `Editing ${String(a.path ?? "")}`;
    case "readFile":
      return `Reading ${String(a.path ?? "")}`;
    case "deleteFile":
      return `Deleting ${String(a.path ?? "")}`;
    case "listFiles":
      return `Listing ${a.path ? String(a.path) : "files"}`;
    case "runCommand":
      return `Running ${String(a.command ?? "")}`;
  }
}

function ActivityRow({ activity }: { activity: ActivityEntry }) {
  const Icon = TOOL_ICON[activity.tool];
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{toolLabel(activity.tool, activity.args)}</span>
      {activity.status === "pending" && <Spinner className="size-3.5 shrink-0" />}
      {activity.status === "success" && <CheckIcon className="size-3.5 shrink-0 text-emerald-500" />}
      {activity.status === "error" && <XIcon className="size-3.5 shrink-0 text-destructive" />}
    </div>
  );
}

function BuildWorkspace() {
  const { sessionId } = useParams({ from: "/dashboard/build/$sessionId" });
  const { q } = Route.useSearch();
  const queryClient = useQueryClient();

  const [items, setItems] = React.useState<ChatItem[]>(() =>
    q ? [{ id: "initial", kind: "user", content: q }] : [],
  );
  const [isGenerating, setIsGenerating] = React.useState(Boolean(q));
  const [prompt, setPrompt] = React.useState("");

  const sandbox = useQuery({
    queryKey: ["agent-sandbox", sessionId],
    queryFn: async () => {
      const res = await api.get<{ data: SandboxResponse }>(`/agent/sandbox/${sessionId}`);
      return res.data.data;
    },
  });

  useAgentEvents(
    sessionId,
    React.useCallback((event: AgentEvent) => {
      switch (event.type) {
        case "tool_start": {
          setItems((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              kind: "activity",
              activity: { id: crypto.randomUUID(), step: event.step, tool: event.tool, args: event.args, status: "pending" },
            },
          ]);
          break;
        }
        case "tool_end": {
          setItems((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              const item = next[i];
              if (item.kind === "activity" && item.activity.step === event.step && item.activity.tool === event.tool && item.activity.status === "pending") {
                next[i] = { ...item, activity: { ...item.activity, status: event.success ? "success" : "error" } };
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
            setItems((prev) => [...prev, { id: crypto.randomUUID(), kind: "assistant", content: event.reply }]);
          }
          queryClient.invalidateQueries({ queryKey: ["agent-sandbox", sessionId] });
          break;
        }
        case "error": {
          setIsGenerating(false);
          setItems((prev) => [...prev, { id: crypto.randomUUID(), kind: "error", content: event.message }]);
          break;
        }
      }
    }, [sessionId, queryClient]),
  );

  const sendPrompt = useMutation({
    mutationFn: async (value: string) => {
      const res = await api.post<{ data: PromptResponse }>("/agent/prompt", {
        prompt: value,
        sessionId,
      });
      return res.data.data;
    },
    onSuccess: () => setIsGenerating(true),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send prompt");
    },
  });

  const handleSend = () => {
    const value = prompt.trim();
    if (!value || sendPrompt.isPending) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), kind: "user", content: value }]);
    setPrompt("");
    sendPrompt.mutate(value);
  };

  const previewUrl = sandbox.data?.previewUrl;

  return (
    <div className="flex h-[calc(100vh-2.5rem)] w-full">
      <div className="flex w-95 shrink-0 flex-col border-r border-border">
        <MessageScroller className="flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="px-4 py-4">
              {items.map((item) => {
                if (item.kind === "activity") {
                  return (
                    <MessageScrollerItem key={item.id}>
                      <ActivityRow activity={item.activity} />
                    </MessageScrollerItem>
                  );
                }
                return (
                  <MessageScrollerItem key={item.id}>
                    <Message align={item.kind === "user" ? "end" : "start"}>
                      <MessageContent>
                        <Bubble
                          align={item.kind === "user" ? "end" : "start"}
                          variant={item.kind === "user" ? "default" : item.kind === "error" ? "destructive" : "muted"}
                        >
                          <BubbleContent>{item.content}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
              {isGenerating && (
                <MessageScrollerItem>
                  <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                    <Spinner className="size-3.5" /> Thinking...
                  </div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>

        <div className="border-t border-border p-3">
          <div className="relative">
            <Textarea
              placeholder="Ask for a change..."
              value={prompt}
              disabled={sendPrompt.isPending}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-20 resize-none pr-12 text-sm"
            />
            <Button
              size="icon-sm"
              className="absolute bottom-2 right-2"
              disabled={!prompt.trim() || sendPrompt.isPending}
              onClick={handleSend}
            >
              {sendPrompt.isPending ? <Spinner /> : <ArrowUpIcon />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="truncate text-xs text-muted-foreground">
            {previewUrl ?? "Starting sandbox..."}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={sandbox.isFetching}
              onClick={() => sandbox.refetch()}
            >
              <RefreshCwIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!previewUrl}
              render={<a href={previewUrl} target="_blank" rel="noreferrer" />}
            >
              <ExternalLinkIcon />
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-muted">
          {previewUrl ? (
            <iframe key={previewUrl} src={previewUrl} className="size-full border-0" title="Live preview" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              {sandbox.isError ? "Failed to load sandbox" : <Spinner className="size-6" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/build/$sessionId")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: BuildWorkspace,
});
