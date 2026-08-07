export type ToolName =
  | "writeFile"
  | "editFile"
  | "readFile"
  | "deleteFile"
  | "listFiles"
  | "runCommand";

export const MUTATING_TOOLS: readonly ToolName[] = [
  "writeFile",
  "editFile",
  "deleteFile",
  "runCommand",
];

export function isMutatingTool(name: ToolName): boolean {
  return (MUTATING_TOOLS as readonly string[]).includes(name);
}
