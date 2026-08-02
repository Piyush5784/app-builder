import type { ToolSchema } from "@/agent/types";

export const tools: ToolSchema[] = [
  {
    name: "writeFile",
    description:
      "Create a new file or overwrite an existing file with full content. Use for new files or full rewrites.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the project root, e.g. src/App.tsx" },
        content: { type: "string", description: "Full file content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "editFile",
    description:
      "Replace one exact snippet of text inside an existing file. Use instead of writeFile when only part of a file changes — cheaper and safer.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the project root" },
        oldString: { type: "string", description: "Exact existing text to find (must match exactly once)" },
        newString: { type: "string", description: "Text to replace it with" },
      },
      required: ["path", "oldString", "newString"],
    },
  },
  {
    name: "readFile",
    description: "Read the full content of a file.",
    parameters: {
      type: "object",
      properties: { path: { type: "string", description: "File path relative to the project root" } },
      required: ["path"],
    },
  },
  {
    name: "deleteFile",
    description: "Delete a file.",
    parameters: {
      type: "object",
      properties: { path: { type: "string", description: "File path relative to the project root" } },
      required: ["path"],
    },
  },
  {
    name: "listFiles",
    description: "List files and folders under a path, so you know what already exists before editing.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path relative to the project root. Defaults to root." },
      },
      required: [],
    },
  },
  {
    name: "runCommand",
    description:
      "Run a shell command in the project directory. Use to install packages or verify the app builds (e.g. npm install, npm run build).",
    parameters: {
      type: "object",
      properties: { command: { type: "string", description: "Shell command to run" } },
      required: ["command"],
    },
  },
];
