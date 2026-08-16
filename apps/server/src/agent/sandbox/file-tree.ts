import type { Sandbox } from "e2b";
import { executer } from "@/agent/tools/executer";

export interface FileTreeNode {
  path: string;
  name: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
}

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".turbo",
  ".vite",
]);

function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

async function buildFileTree(
  sandbox: Sandbox,
  relativePath = "",
): Promise<FileTreeNode[]> {
  const entries = await sandbox.files.list(
    executer.resolvePath(relativePath || undefined),
  );

  const nodes = await Promise.all(
    entries
      .filter((entry) => entry.type !== "dir" || !EXCLUDED_DIRS.has(entry.name))
      .map(async (entry): Promise<FileTreeNode> => {
        const entryPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        if (entry.type === "dir") {
          return {
            path: entryPath,
            name: entry.name,
            type: "dir",
            children: await buildFileTree(sandbox, entryPath),
          };
        }
        return { path: entryPath, name: entry.name, type: "file" };
      }),
  );

  return sortNodes(nodes);
}

export const fileTree = { buildFileTree };
