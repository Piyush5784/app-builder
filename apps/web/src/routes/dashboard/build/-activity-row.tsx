import type { ToolName } from "@package/shared";
import { Spinner } from "@package/ui/components/spinner";
import {
  FilePlus2Icon,
  FileEditIcon,
  FileTextIcon,
  Trash2Icon,
  FolderTreeIcon,
  TerminalIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import type { ActivityEntry } from "@/routes/dashboard/build/-types";

const TOOL_ICON: Record<
  ToolName,
  React.ComponentType<{ className?: string }>
> = {
  writeFile: FilePlus2Icon,
  editFile: FileEditIcon,
  readFile: FileTextIcon,
  deleteFile: Trash2Icon,
  listFiles: FolderTreeIcon,
  runCommand: TerminalIcon,
};

export function toolLabel(tool: ToolName, args: unknown): string {
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

export function ActivityRow({ activity }: { activity: ActivityEntry }) {
  const Icon = TOOL_ICON[activity.tool];
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {toolLabel(activity.tool, activity.args)}
      </span>
      {activity.status === "pending" && (
        <Spinner className="size-3.5 shrink-0" />
      )}
      {activity.status === "success" && (
        <CheckIcon className="size-3.5 shrink-0 text-emerald-500" />
      )}
      {activity.status === "error" && (
        <XIcon className="size-3.5 shrink-0 text-destructive" />
      )}
    </div>
  );
}
