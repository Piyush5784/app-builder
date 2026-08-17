import type * as React from "react";
import Editor from "@monaco-editor/react";
import { Spinner } from "@package/ui/components/spinner";
import { TreeView } from "@package/ui/components/tree-view";
import {
  FolderIcon,
  FileCode2Icon,
  CheckIcon,
  CircleAlertIcon,
} from "lucide-react";
import type {
  FileResponse,
  FileTreeNode,
} from "@/routes/dashboard/build/-types";
import { toTreeData, getLanguage } from "@/routes/dashboard/build/-file-tree";

// The code view's file tree + Monaco editor, with a save-status indicator
// in the header. All edit/save state lives in useFileEditor (-hooks.ts) —
// this component is purely the rendering of it.
export function CodeView({
  filesQuery,
  fileQuery,
  selectedPath,
  onSelectFile,
  editedContent,
  setEditedContent,
  saveStatus,
  onFlushOnBlur,
  isGenerating,
  resolvedTheme,
}: {
  filesQuery: {
    isLoading: boolean;
    data: FileTreeNode[] | undefined;
  };
  fileQuery: {
    isLoading: boolean;
    data: FileResponse | undefined;
  };
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  editedContent: Record<string, string>;
  setEditedContent: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onFlushOnBlur: () => void;
  isGenerating: boolean;
  resolvedTheme: string;
}) {
  return (
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
              if (item && !item.children) onSelectFile(item.id);
            }}
          />
        ) : (
          <div className="p-4 text-xs text-muted-foreground">
            Failed to load files
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        {selectedPath && (
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
            <span className="truncate font-mono">{selectedPath}</span>
            {isGenerating ? (
              <span>Agent is working — editing disabled</span>
            ) : saveStatus === "saving" ? (
              <span className="flex items-center gap-1">
                <Spinner className="size-3" /> Saving…
              </span>
            ) : editedContent[selectedPath] !== undefined ? (
              <span>Unsaved changes</span>
            ) : saveStatus === "error" ? (
              <span className="flex items-center gap-1 text-destructive">
                <CircleAlertIcon className="size-3" /> Failed to save
              </span>
            ) : saveStatus === "saved" ? (
              <span className="flex items-center gap-1">
                <CheckIcon className="size-3" /> Saved
              </span>
            ) : null}
          </div>
        )}
        <div className="flex-1">
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
                value={
                  editedContent[selectedPath] ?? fileQuery.data?.content ?? ""
                }
                onChange={(nextValue) => {
                  if (nextValue === undefined) return;
                  setEditedContent((prev) => ({
                    ...prev,
                    [selectedPath]: nextValue,
                  }));
                }}
                beforeMount={(monaco) => {
                  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
                    {
                      ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
                      moduleResolution:
                        monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                      baseUrl: ".",
                      paths: { "@/*": ["src/*"] },
                    },
                  );

                  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
                    {
                      ...monaco.languages.typescript.typescriptDefaults.getDiagnosticsOptions(),
                      diagnosticCodesToIgnore: [2307, 2792],
                    },
                  );
                }}
                onMount={(editorInstance) => {
                  editorInstance.onDidBlurEditorWidget(onFlushOnBlur);
                }}
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                options={{
                  readOnly: isGenerating,
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
    </div>
  );
}
