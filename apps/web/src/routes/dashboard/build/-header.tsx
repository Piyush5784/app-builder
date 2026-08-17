import { Button } from "@package/ui/components/button";
import { Spinner } from "@package/ui/components/spinner";
import { Separator } from "@package/ui/components/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@package/ui/components/dropdown-menu";
import {
  ExternalLinkIcon,
  RefreshCwIcon,
  EyeIcon,
  Code2Icon,
  FileDownIcon,
  FolderArchiveIcon,
  Share2Icon,
  ChevronDownIcon,
} from "lucide-react";

// The bar above the preview/code panel — view toggle, sandbox refresh +
// preview URL, and the download/share actions.
export function WorkspaceToolbar({
  view,
  setView,
  isGenerating,
  isRefreshing,
  onRefresh,
  previewUrl,
  isDownloadingZip,
  canDownloadSingleFile,
  onDownloadFile,
  onDownloadZip,
  onShare,
}: {
  view: "preview" | "code";
  setView: (view: "preview" | "code") => void;
  isGenerating: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  previewUrl: string | null | undefined;
  isDownloadingZip: boolean;
  canDownloadSingleFile: boolean;
  onDownloadFile: () => void;
  onDownloadZip: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <div className="flex items-center gap-0.5 bg-muted p-0.5">
        <Button
          size="xs"
          className="px-3"
          variant={view === "preview" ? "default" : "ghost"}
          onClick={() => setView("preview")}
        >
          <EyeIcon className="size-3.5" /> Preview
        </Button>
        <Button
          size="xs"
          className="px-3"
          variant={view === "code" ? "default" : "ghost"}
          onClick={() => setView("code")}
        >
          <Code2Icon className="size-3.5" /> Code
        </Button>
      </div>

      <div className="flex items-center gap-0.5 border border-border bg-muted/40 p-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          className=" "
          disabled={isGenerating || isRefreshing}
          onClick={onRefresh}
        >
          {isRefreshing ? <Spinner className="size-3.5" /> : <RefreshCwIcon />}
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
          render={
            <a
              href={previewUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <ExternalLinkIcon />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 border border-border bg-muted/40 p-0.5">
        <DropdownMenu>
          <Button
            size="xs"
            variant="ghost"
            className="px-3"
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
              disabled={!canDownloadSingleFile}
              onClick={onDownloadFile}
            >
              <FileDownIcon />
              Download single file
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isDownloadingZip}
              onClick={onDownloadZip}
            >
              <FolderArchiveIcon />
              Download all (.zip)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="xs" variant="ghost" className="px-3" onClick={onShare}>
          <Share2Icon className="size-3.5" /> Share
        </Button>
      </div>
    </div>
  );
}
