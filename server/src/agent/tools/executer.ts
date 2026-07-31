import type { Sandbox } from "e2b";
import { config } from "../config";
import type { ToolCall } from "../types";

function resolvePath(pathInput: string | undefined): string {
  const cleaned = (pathInput ?? "").replace(/^\/+/, "");
  if (cleaned.startsWith("home/user/app/")) return `/${cleaned}`;
  return `${config.e2b.appDir}/${cleaned}`.replace(/\/$/, "");
}

export async function executeTool(sandbox: Sandbox, call: ToolCall): Promise<string> {
  console.log(`[tool] calling ${call.name} with args: ${JSON.stringify(call.arguments)}`);

  try {
    switch (call.name) {
      case "writeFile": {
        const path = resolvePath(call.arguments.path);
        await sandbox.files.write(path, call.arguments.content);
        return `Wrote ${path}`;
      }

      case "editFile": {
        const path = resolvePath(call.arguments.path);
        const current = await sandbox.files.read(path);
        const text = typeof current === "string" ? current : String(current);
        const occurrences = text.split(call.arguments.oldString).length - 1;

        if (occurrences === 0) {
          return `Error: oldString not found in ${path}. Read the file again to get exact current content.`;
        }
        if (occurrences > 1) {
          return `Error: oldString matches ${occurrences} times in ${path}. Make it more specific so it matches exactly once.`;
        }

        const updated = text.replace(call.arguments.oldString, call.arguments.newString);
        await sandbox.files.write(path, updated);
        return `Edited ${path}`;
      }

      case "readFile": {
        const path = resolvePath(call.arguments.path);
        const content = await sandbox.files.read(path);
        return typeof content === "string" ? content : String(content);
      }

      case "deleteFile": {
        const path = resolvePath(call.arguments.path);
        await sandbox.files.remove(path);
        return `Deleted ${path}`;
      }

      case "listFiles": {
        const path = resolvePath(call.arguments.path);
        const entries = await sandbox.files.list(path);
        return entries.map((e) => `${e.type === "dir" ? "d" : "f"} ${e.name}`).join("\n") || "(empty)";
      }

      case "runCommand": {
        const result = await sandbox.commands.run(call.arguments.command, {
          cwd: config.e2b.appDir,
          requestTimeoutMs: 60_000,
        });
        return [
          `exit code: ${result.exitCode}`,
          result.stdout ? `stdout:\n${result.stdout}` : "",
          result.stderr ? `stderr:\n${result.stderr}` : "",
        ]
          .filter(Boolean)
          .join("\n\n")
          .slice(0, 4000);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[tool] ${call.name} failed: ${message}`);
    return `Error running ${call.name}: ${message}`;
  }
}

/**
 * Re-runs a recorded sequence of mutating tool calls against a fresh sandbox,
 * in order, to rebuild the state a dead sandbox had. Used when a session's
 * sandbox died (idle timeout, crash) and a new one was just created.
 */
export async function replayEvents(sandbox: Sandbox, calls: ToolCall[]): Promise<void> {
  console.log(`[tool] replaying ${calls.length} recorded event(s) on fresh sandbox`);

  for (const call of calls) {
    const output = await executeTool(sandbox, call);
    if (output.startsWith("Error")) {
      // A failed replay step means the sandbox no longer matches what the
      // conversation history assumes — better to stop than continue on a
      // silently inconsistent state.
      throw new Error(`Replay of ${call.name} failed: ${output}`);
    }
  }

  console.log(`[tool] replay finished`);
}
