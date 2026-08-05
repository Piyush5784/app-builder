import * as React from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import Editor from "@monaco-editor/react";
import { useAgentEvents } from "@/hooks/use-agent-events";
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
import type { ChatItem } from "@/routes/dashboard/build/-types";
import { downloadFile, downloadZip } from "@/routes/dashboard/build/-download";
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
} from "@/routes/dashboard/build/-hooks";
import { ActivityRow } from "@/routes/dashboard/build/-activity-row";
import { toTreeData, getLanguage } from "@/routes/dashboard/build/-file-tree";

function BuildWorkspace() {
  const { sessionId } = useParams({ from: "/dashboard/build/$sessionId" });
  const { q } = Route.useSearch();

  const [items, setItems] = React.useState<ChatItem[]>(() =>
    q ? [{ id: "initial", kind: "user", content: q }] : [],
  );
  const [isGenerating, setIsGenerating] = React.useState(Boolean(q));
  const [prompt, setPrompt] = React.useState("");
  const [view, setView] = React.useState<"preview" | "code">("preview");
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = React.useState(false);
  const resolvedTheme = useResolvedTheme();

  const runsQuery = useRunsQuery(sessionId);
  const toolInvocationsQuery = useToolInvocationsQuery(sessionId);

  useHistorySeed(
    runsQuery.data,
    toolInvocationsQuery.data,
    (seededItems, seededIsGenerating) => {
      setItems(seededItems);
      setIsGenerating(seededIsGenerating);
    },
  );

  const filesQuery = useFilesQuery(sessionId, view === "code");
  const fileQuery = useFileQuery(
    sessionId,
    selectedPath,
    view === "code" && Boolean(selectedPath),
  );
  const sandbox = useSandboxQuery(sessionId);

  const handleAgentEvent = useAgentEventHandler(
    sessionId,
    setItems,
    setIsGenerating,
  );
  useAgentEvents(sessionId, handleAgentEvent);

  const sendPrompt = useSendPrompt(sessionId, () => setIsGenerating(true));
  const cancelGeneration = useCancelGeneration(sessionId);
  useCancelOnEscape(isGenerating, cancelGeneration.mutate);

  const handleSend = () => {
    const value = prompt.trim();
    if (!value || sendPrompt.isPending || isGenerating) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: "user", content: value },
    ]);
    setPrompt("");
    sendPrompt.mutate(value);
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
        </MessageScrollerProvider>

        <div className="border-t border-border p-3">
          <div className="relative">
            <Textarea
              placeholder="Ask for a change..."
              value={prompt}
              disabled={sendPrompt.isPending || isGenerating}
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
              className="min-h-20 resize-none pr-12 text-sm"
            />
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
                disabled={!prompt.trim() || sendPrompt.isPending}
                onClick={handleSend}
              >
                {sendPrompt.isPending ? <Spinner /> : <ArrowUpIcon />}
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
              disabled={sandbox.isFetching}
              onClick={() => sandbox.refetch()}
            >
              <RefreshCwIcon />
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

function BuildWorkspaceRoute() {
  const { sessionId } = useParams({ from: "/dashboard/build/$sessionId" });
  return <BuildWorkspace key={sessionId} />;
}

export const Route = createFileRoute("/dashboard/build/$sessionId")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: BuildWorkspaceRoute,
});
