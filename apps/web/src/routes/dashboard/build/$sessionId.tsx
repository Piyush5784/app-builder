import * as React from "react";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@package/ui/components/resizable";
import { toast } from "sonner";
import type { AgentEvent } from "@package/shared";
import type { ChatItem } from "@/routes/dashboard/build/-types";
import { downloadFile, downloadZip } from "@/routes/dashboard/build/-download";
import { invalidateQueriesForTable } from "@/utils/query-cache";
import { useUser } from "@/hooks/use-user";
import {
  useRunsQuery,
  useHistorySeed,
  useFilesQuery,
  useFileQuery,
  useFileEditor,
  useSandboxQuery,
  useSendPrompt,
  useCancelGeneration,
  useCancelOnEscape,
  useAgentEventHandler,
  useModelsQuery,
} from "@/routes/dashboard/build/-hooks";
import { ChatPanel } from "@/routes/dashboard/build/-chat-panel";
import { ChatInput } from "@/routes/dashboard/build/-input";
import { WorkspaceToolbar } from "@/routes/dashboard/build/-header";
import { PreviewPane } from "@/routes/dashboard/build/-preview-pane";
import { CodeView } from "@/routes/dashboard/build/-code-view";

function BuildWorkspace() {
  const { sessionId } = useParams({ from: "/dashboard/build/$sessionId" });
  const navigate = useNavigate();
  const isNew = sessionId === "new";

  const [items, setItems] = React.useState<ChatItem[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [view, setView] = React.useState<"preview" | "code">("preview");
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
  const [hasSandbox, setHasSandbox] = React.useState(false);

  if (sessionId !== prevSessionId) {
    const selfAssigned = sessionId === selfAssignedId;
    setPrevSessionId(sessionId);
    setSelfAssignedId(null);
    if (!selfAssigned) {
      setItems([]);
      setIsGenerating(false);
      setPrompt("");
      setHasSandbox(false);
    }
    setSkipDbSeed(selfAssigned || sessionId === "new");
  }

  const enableHistoryQueries = !isNew && !skipDbSeed;
  const runsQuery = useRunsQuery(sessionId, enableHistoryQueries);
  const sandbox = useSandboxQuery(sessionId, !isNew);

  const historySeed = useHistorySeed(
    sessionId,
    enableHistoryQueries,
    runsQuery.data,
    enableHistoryQueries ? sandbox.data?.toolInvocations : undefined,
  );

  React.useEffect(() => {
    if (historySeed.status !== "seeded") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: historySeed resolves at most once (stable ref), not a render-time derivation
    setItems(historySeed.items);
    setIsGenerating(historySeed.isGenerating);
  }, [historySeed]);

  const filesQuery = useFilesQuery(sessionId, !isNew && view === "code");
  const fileEditor = useFileEditor(sessionId);
  const fileQuery = useFileQuery(
    sessionId,
    fileEditor.selectedPath,
    !isNew && view === "code" && Boolean(fileEditor.selectedPath),
  );

  const baseHandleAgentEvent = useAgentEventHandler(
    sessionId,
    setItems,
    setIsGenerating,
  );

  const handleAgentEvent = React.useCallback(
    (event: AgentEvent) => {
      if (event.type === "session_ready" && isNew) {
        invalidateQueriesForTable("AgentSession");
        setSelfAssignedId(event.sessionId);
        navigate({
          to: "/dashboard/build/$sessionId",
          params: { sessionId: event.sessionId },
          replace: true,
        });
      }
      if (event.type === "sandbox_ready") {
        setHasSandbox(true);
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

  const previewUrl = sandbox.data?.previewUrl;

  const handleShare = async () => {
    if (!previewUrl) return;
    await navigator.clipboard.writeText(previewUrl);
    toast.success("Link copied to clipboard");
  };

  const sandboxExists = hasSandbox || Boolean(previewUrl);

  if (isNew) {
    return (
      <ChatInput
        prompt={prompt}
        setPrompt={setPrompt}
        isGenerating={isGenerating}
        handleSend={handleSend}
        modelsQuery={modelsQuery}
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
        credits={credits}
      />
    );
  }

  const chatPanel = (
    <ChatPanel
      items={items}
      isGenerating={isGenerating}
      isLoadingHistory={historySeed.status === "pending"}
      prompt={prompt}
      setPrompt={setPrompt}
      handleSend={handleSend}
      cancelGeneration={cancelGeneration}
      modelsQuery={modelsQuery}
      selectedModelId={selectedModelId}
      setSelectedModelId={setSelectedModelId}
      credits={credits}
    />
  );

  // Wait for the first sandbox fetch to actually resolve rather than
  // optimistically assuming "exists" while it's in flight — guessing here
  // is what caused a show-then-unshow flash on initial load whenever the
  // real answer turned out to be "no sandbox yet".
  if (sandbox.isLoading) {
    return <div className="mx-auto h-full max-w-2xl">{chatPanel}</div>;
  }

  if (!sandboxExists) {
    return <div className="mx-auto h-full max-w-2xl">{chatPanel}</div>;
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      <ResizablePanel
        defaultSize="30"
        minSize="20"
        maxSize="45"
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        {chatPanel}
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize="70"
        minSize="30"
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        <WorkspaceToolbar
          view={view}
          setView={setView}
          isGenerating={isGenerating}
          isRefreshing={sandbox.isFetching || filesQuery.isFetching}
          onRefresh={() => {
            sandbox.refetch();
            filesQuery.refetch();
          }}
          previewUrl={previewUrl}
          isDownloadingZip={isDownloadingZip}
          canDownloadSingleFile={Boolean(
            fileEditor.selectedPath && fileQuery.data,
          )}
          onDownloadFile={() => {
            if (fileEditor.selectedPath && fileQuery.data) {
              downloadFile(fileEditor.selectedPath, fileQuery.data.content);
            }
          }}
          onDownloadZip={handleDownloadZip}
          onShare={handleShare}
        />

        {view === "preview" ? (
          <PreviewPane
            previewUrl={previewUrl}
            isFetching={sandbox.isFetching}
            isError={sandbox.isError}
            items={items}
          />
        ) : (
          <CodeView
            filesQuery={filesQuery}
            fileQuery={fileQuery}
            selectedPath={fileEditor.selectedPath}
            onSelectFile={fileEditor.selectFile}
            editedContent={fileEditor.editedContent}
            setEditedContent={fileEditor.setEditedContent}
            saveStatus={fileEditor.saveStatus}
            onFlushOnBlur={fileEditor.flushOnBlur}
            isGenerating={isGenerating}
            resolvedTheme={resolvedTheme}
          />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export const Route = createFileRoute("/dashboard/build/$sessionId")({
  component: BuildWorkspace,
});
