import type { Sandbox } from "e2b";
import { logger } from "@/agent/telemetry";
import type { ToolCall } from "@/agent/types";

const E2B_APP_DIR = "/home/user/app";

function resolvePath(pathInput: string | undefined): string {
  const cleaned = (pathInput ?? "").replace(/^\/+/, "");
  if (cleaned.startsWith("home/user/app/")) return `/${cleaned}`;
  return `${E2B_APP_DIR}/${cleaned}`.replace(/\/$/, "");
}

export async function executeTool(
  sandbox: Sandbox,
  call: ToolCall,
): Promise<string> {
  logger.info("tool", "calling", { tool: call.name, args: call.arguments });

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

        const updated = text.replace(
          call.arguments.oldString,
          call.arguments.newString,
        );
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
        return (
          entries
            .map((e) => `${e.type === "dir" ? "d" : "f"} ${e.name}`)
            .join("\n") || "(empty)"
        );
      }

      case "runCommand": {
        const result = await sandbox.commands.run(call.arguments.command, {
          cwd: E2B_APP_DIR,
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
    logger.error("tool", "failed", { tool: call.name, error: message });
    return `Error running ${call.name}: ${message}`;
  }
}

/**
 * Re-runs a recorded sequence of mutating tool calls against a fresh sandbox,
 * in order, to rebuild the state a dead sandbox had. Used when a session's
 * sandbox died (idle timeout, crash) and a new one was just created.
 */
export async function replayEvents(
  sandbox: Sandbox,
  calls: ToolCall[],
): Promise<void> {
  logger.info("tool", "replaying recorded events on fresh sandbox", {
    count: calls.length,
  });

  for (const call of calls) {
    const output = await executeTool(sandbox, call);
    if (output.startsWith("Error")) {
      // A failed replay step means the sandbox no longer matches what the
      // conversation history assumes — better to stop than continue on a
      // silently inconsistent state.
      throw new Error(`Replay of ${call.name} failed: ${output}`);
    }
  }

  logger.info("tool", "replay finished", { count: calls.length });
}
