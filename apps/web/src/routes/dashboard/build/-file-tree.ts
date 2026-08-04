import { FolderIcon, FileCode2Icon } from "lucide-react";
import type { TreeDataItem } from "@package/ui/components/tree-view";
import type { FileTreeNode } from "@/routes/dashboard/build/-types";

export function toTreeData(nodes: FileTreeNode[]): TreeDataItem[] {
  return nodes.map((node) => ({
    id: node.path,
    name: node.name,
    icon: node.type === "dir" ? FolderIcon : FileCode2Icon,
    children: node.children ? toTreeData(node.children) : undefined,
  }));
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
};

export function getLanguage(path: string): string {
  const extension = path.split(".").pop() ?? "";
  return LANGUAGE_BY_EXTENSION[extension] ?? "plaintext";
}
