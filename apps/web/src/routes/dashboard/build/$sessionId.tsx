import * as React from "react";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import Editor from "@monaco-editor/react";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { Textarea } from "@package/ui/components/textarea";
import { Button } from "@package/ui/components/button";
import { Spinner } from "@package/ui/components/spinner";
import { TreeView } from "@package/ui/components/tree-view";
import { Separator } from "@package/ui/components/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@package/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@package/ui/components/select";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@package/ui/components/resizable";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@package/ui/components/message-scroller";
import { Message, MessageContent } from "@package/ui/components/message";
import { Bubble, BubbleContent } from "@package/ui/components/bubble";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import {
  ArrowUpIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  EyeIcon,
  Code2Icon,
  FolderIcon,
  FileCode2Icon,
  SquareIcon,
  FileDownIcon,
  FolderArchiveIcon,
  Share2Icon,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { AgentEvent } from "@package/shared";
import type { ChatItem, ModelInfo } from "@/routes/dashboard/build/-types";
import { downloadFile, downloadZip } from "@/routes/dashboard/build/-download";
import { invalidateQueriesForTable } from "@/utils/query-cache";
import { WebglMorph } from "@/components/custom/webgl-morph/webgl-morph";
import { useUser } from "@/hooks/use-user";
import {
  useRunsQuery,
  useToolInvocationsQuery,
  useHistorySeed,
  useFilesQuery,
  useFileQuery,
  useSandboxQuery,
  useSendPrompt,
  useCancelGeneration,
  useCancelOnEscape,
  useAgentEventHandler,
  useModelsQuery,
} from "@/routes/dashboard/build/-hooks";
import { ActivityRow } from "@/routes/dashboard/build/-activity-row";
import { toTreeData, getLanguage } from "@/routes/dashboard/build/-file-tree";

const EXAMPLE_PROMPTS = [
  "A landing page for a coffee subscription box",
  "A pricing page with three tiers and a toggle for monthly/yearly",
  "A dashboard with a sidebar and a table of recent orders",
];

// Stable reference so Streamdown doesn't see a new plugins object every
// render.
const streamdownPlugins = { cjk, code, math, mermaid };

// Paid models show disabled once credits run out — the backend is the real
// gate (see agent.routes.ts), this is just so the picker doesn't offer an
// option that would immediately fail.
function ModelPicker({
  models,
  value,
  onChange,
  credits,
  disabled,
}: {
  models: ModelInfo[];
  value: string;
  onChange: (id: string) => void;
  credits: number;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="w-auto">
        <SelectValue placeholder="Model">
          {(id: string | null) =>
            models.find((model) => model.id === id)?.label ?? "Model"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            disabled={model.tier === "paid" && credits <= 0}
          >
            {model.label}
            {model.tier === "paid" ? " (Paid)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BuildWorkspace() {
  const { sessionId } = useParams({ from: "/dashboard/build/$sessionId" });
  const navigate = useNavigate();
  const isNew = sessionId === "new";

  const [items, setItems] = React.useState<ChatItem[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [view, setView] = React.useState<"preview" | "code">("preview");
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = React.useState(false);
  const [selectedModelId, setSelectedModelId] = React.useState("nvidia");
  const resolvedTheme = useResolvedTheme();
  const modelsQuery = useModelsQuery();
  const { data: userData } = useUser();
  const credits = userData?.user.credits ?? 0;
  const [selfAssignedId, setSelfAssignedId] = React.useState<string | null>(
    null,
  );
  const [prevSessionId, setPrevSessionId] = React.useState(sessionId);
  const [skipDbSeed, setSkipDbSeed] = React.useState(isNew);

  if (sessionId !== prevSessionId) {
    const selfAssigned = sessionId === selfAssignedId;
    setPrevSessionId(sessionId);
    setSelfAssignedId(null);
    if (!selfAssigned) {
      setItems([]);
      setIsGenerating(false);
      setPrompt("");
    }
    setSkipDbSeed(selfAssigned || sessionId === "new");
  }

  const enableHistoryQueries = !isNew && !skipDbSeed;
  const runsQuery = useRunsQuery(sessionId, enableHistoryQueries);
  const toolInvocationsQuery = useToolInvocationsQuery(
    sessionId,
    enableHistoryQueries,
  );

  const historySeed = useHistorySeed(
    sessionId,
    runsQuery.data,
    toolInvocationsQuery.data,
  );

  React.useEffect(() => {
    if (historySeed.status !== "seeded") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: historySeed resolves at most once (stable ref), not a render-time derivation
    setItems(historySeed.items);
    setIsGenerating(historySeed.isGenerating);
  }, [historySeed]);

  const filesQuery = useFilesQuery(sessionId, !isNew && view === "code");
  const fileQuery = useFileQuery(
    sessionId,
    selectedPath,
    !isNew && view === "code" && Boolean(selectedPath),
  );
  const sandbox = useSandboxQuery(sessionId, !isNew);

  const baseHandleAgentEvent = useAgentEventHandler(
    sessionId,
    setItems,
    setIsGenerating,
  );

  const handleAgentEvent = React.useCallback(
    (event: AgentEvent) => {
      if (event.type === "sandbox_ready" && isNew) {
        invalidateQueriesForTable("AgentSession");
        setSelfAssignedId(event.sessionId);
        navigate({
          to: "/dashboard/build/$sessionId",
          params: { sessionId: event.sessionId },
          replace: true,
        });
      }
      if (event.type === "error" && isNew) {
        toast.error(event.message);
      }
      baseHandleAgentEvent(event);
    },
    [isNew, navigate, baseHandleAgentEvent],
  );

  const sendPrompt = useSendPrompt(
    isNew ? undefined : sessionId,
    handleAgentEvent,
  );
  const cancelGeneration = useCancelGeneration(sessionId);
  useCancelOnEscape(isGenerating, cancelGeneration.mutate);

  const handleSend = () => {
    const value = prompt.trim();
    if (!value || isGenerating) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: "user", content: value },
    ]);
    setPrompt("");
    setIsGenerating(true);
    sendPrompt.mutate(value, selectedModelId);
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadZip(sessionId);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    await navigator.clipboard.writeText(previewUrl);
    toast.success("Link copied to clipboard");
  };

  const previewUrl = sandbox.data?.previewUrl;

  if (isNew) {
    return (
      <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 px-4">
        <WebglMorph position="background" />
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            What do you want to build?
          </h1>
          <p className="text-white">
            Describe an app or page and it'll be generated for you in a live
            sandbox.
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="relative">
            <Textarea
              autoFocus
              placeholder="Build a landing page for..."
              value={prompt}
              disabled={isGenerating}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-28 resize-none pb-11 pr-12 text-white bg-black!"
            />
            {modelsQuery.data && (
              <div className="absolute bottom-2.5 left-2.5">
                <ModelPicker
                  models={modelsQuery.data}
                  value={selectedModelId}
                  onChange={setSelectedModelId}
                  credits={credits}
                  disabled={isGenerating}
                />
              </div>
            )}
            <Button
              size="icon-sm"
              className="absolute bottom-2.5 right-2.5"
              disabled={!prompt.trim() || isGenerating}
              onClick={handleSend}
            >
              {isGenerating ? <Spinner /> : <ArrowUpIcon />}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isGenerating}
                onClick={() => setPrompt(example)}
                className="rounded-md bg-white border border-border px-3 py-1.5 text-xs text-black transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      <ResizablePanel
        defaultSize="30"
        minSize="20"
        maxSize="45"
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="min-h-0 flex-1">
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
                            variant={
                              item.kind === "user"
                                ? "default"
                                : item.kind === "error"
                                  ? "destructive"
                                  : "muted"
                            }
                          >
                            <BubbleContent>
                              {item.kind === "assistant" ? (
                                <Streamdown
                                  mode="static"
                                  plugins={streamdownPlugins}
                                >
                                  {item.content}
                                </Streamdown>
                              ) : (
                                item.content
                              )}
                            </BubbleContent>
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
        </MessageScrollerProvider>

        <div className="border-t border-border p-3">
          <div className="relative">
            <Textarea
              placeholder="Ask for a change..."
              value={prompt}
              disabled={isGenerating}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === "Escape" && isGenerating) {
                  cancelGeneration.mutate();
                }
              }}
              className="min-h-20 resize-none pb-9 pr-12 text-sm"
            />
            {modelsQuery.data && (
              <div className="absolute bottom-2 left-2">
                <ModelPicker
                  models={modelsQuery.data}
                  value={selectedModelId}
                  onChange={setSelectedModelId}
                  credits={credits}
                  disabled={isGenerating}
                />
              </div>
            )}
            {isGenerating ? (
              <Button
                size="icon-sm"
                className="absolute bottom-2 right-2"
                disabled={cancelGeneration.isPending}
                onClick={() => cancelGeneration.mutate()}
                title="Stop generating (Esc)"
              >
                <SquareIcon className="fill-current" />
              </Button>
            ) : (
              <Button
                size="icon-sm"
                className="absolute bottom-2 right-2"
                disabled={!prompt.trim()}
                onClick={handleSend}
              >
                <ArrowUpIcon />
              </Button>
            )}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize="70"
        minSize="30"
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-0.5    bg-muted p-0.5">
            <Button
              size="xs"
              className="  px-3"
              variant={view === "preview" ? "default" : "ghost"}
              onClick={() => setView("preview")}
            >
              <EyeIcon className="size-3.5" /> Preview
            </Button>
            <Button
              size="xs"
              className="  px-3"
              variant={view === "code" ? "default" : "ghost"}
              onClick={() => setView("code")}
            >
              <Code2Icon className="size-3.5" /> Code
            </Button>
          </div>

          <div className="flex items-center gap-0.5   border border-border bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              className=" "
              disabled={sandbox.isFetching || filesQuery.isFetching}
              onClick={() => {
                sandbox.refetch();
                filesQuery.refetch();
              }}
            >
              {sandbox.isFetching || filesQuery.isFetching ? (
                <Spinner className="size-3.5" />
              ) : (
                <RefreshCwIcon />
              )}
            </Button>

            <Separator orientation="vertical" />

            <span className="max-w-60 truncate px-2 text-xs text-muted-foreground">
              {previewUrl ?? "Starting sandbox..."}
            </span>

            <Separator orientation="vertical" />

            <Button
              variant="link"
              size="icon-xs"
              className=" "
              disabled={!previewUrl}
              nativeButton={false}
              render={<a href={previewUrl} target="_blank" rel="noreferrer" />}
            >
              <ExternalLinkIcon />
            </Button>
          </div>

          <div className="flex items-center gap-0.5   border border-border bg-muted/40 p-0.5">
            <DropdownMenu>
              <Button
                size="xs"
                variant="ghost"
                className="  px-3"
                render={<DropdownMenuTrigger />}
              >
                {isDownloadingZip ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <FileDownIcon className="size-3.5" />
                )}
                Download
                <ChevronDownIcon className="size-3 opacity-60" />
              </Button>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!selectedPath || !fileQuery.data}
                  onClick={() => {
                    if (selectedPath && fileQuery.data) {
                      downloadFile(selectedPath, fileQuery.data.content);
                    }
                  }}
                >
                  <FileDownIcon />
                  Download single file
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isDownloadingZip}
                  onClick={handleDownloadZip}
                >
                  <FolderArchiveIcon />
                  Download all (.zip)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="xs"
              variant="ghost"
              className="  px-3"
              onClick={handleShare}
            >
              <Share2Icon className="size-3.5" /> Share
            </Button>
          </div>
        </div>

        {view === "preview" ? (
          <div className="min-h-0 flex-1 bg-muted">
            {previewUrl ? (
              <iframe
                key={previewUrl}
                src={previewUrl}
                loading="lazy"
                allowFullScreen
                className="size-full border-0"
                title="Live preview"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                {sandbox.isError ? (
                  "Failed to load sandbox"
                ) : (
                  <Spinner className="size-6" />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="w-64 shrink-0 overflow-y-auto border-r border-border">
              {filesQuery.isLoading ? (
                <div className="flex justify-center p-4">
                  <Spinner className="size-4" />
                </div>
              ) : filesQuery.data ? (
                <TreeView
                  data={toTreeData(filesQuery.data)}
                  defaultLeafIcon={FileCode2Icon}
                  defaultNodeIcon={FolderIcon}
                  initialSelectedItemId={selectedPath ?? undefined}
                  onSelectChange={(item) => {
                    if (item && !item.children) setSelectedPath(item.id);
                  }}
                />
              ) : (
                <div className="p-4 text-xs text-muted-foreground">
                  Failed to load files
                </div>
              )}
            </div>
            <div className="flex-1 ">
              {selectedPath ? (
                fileQuery.isLoading ? (
                  <div className="flex size-full items-center justify-center">
                    <Spinner className="size-6" />
                  </div>
                ) : (
                  <Editor
                    key={selectedPath}
                    path={selectedPath}
                    language={getLanguage(selectedPath)}
                    value={fileQuery.data?.content ?? ""}
                    theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      automaticLayout: true,
                    }}
                  />
                )
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                  Select a file to view its content
                </div>
              )}
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export const Route = createFileRoute("/dashboard/build/$sessionId")({
  component: BuildWorkspace,
});
