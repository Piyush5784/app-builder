import type { Sandbox } from "e2b";
import { resolvePath } from "@/agent/tools";

export interface FileTreeNode {
  path: string;
  name: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
}

// Vendor/build output — noisy and huge, never what a "view the code" feature
// is for.
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

export async function buildFileTree(
  sandbox: Sandbox,
  relativePath = "",
): Promise<FileTreeNode[]> {
  const entries = await sandbox.files.list(
    resolvePath(relativePath || undefined),
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
