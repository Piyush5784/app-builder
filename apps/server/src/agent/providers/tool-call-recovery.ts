import { toToolCall, type ToolCall } from "@/agent/types";

/**
 * Scans a string for top-level {...} JSON objects via brace-depth tracking
 * (string-literal aware, so braces inside quoted values — including JSX like
 * `{logo}` embedded in a file-content string — don't throw off the count).
 * Correctly splits any number of tool-call blobs regardless of whether
 * they're separated by newlines, spaces, or nothing at all — unlike a naive
 * whole-string JSON.parse, which only ever finds the first one.
 */
export function extractJsonObjects(text: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escapeNext) escapeNext = false;
      else if (char === "\\") escapeNext = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return objects;
}

/**
 * Some models (esp. local/small ones) put the tool call's JSON straight into
 * `content` instead of the real tool_calls field — sometimes wrapped in
 * Qwen-style <tool_call>...</tool_call> tags, sometimes bare like
 * {"name": "listFiles", "arguments": {}}, and sometimes several of either
 * form back to back in one response. Recover every one we can instead of
 * burning a retry on a response that was actually fine.
 */
export function extractFallbackToolCalls(content: string): ToolCall[] {
  const wrapped = [
    ...content.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/g),
  ].map((m) => m[1] ?? "");
  const candidates =
    wrapped.length > 0
      ? wrapped.flatMap((block) => extractJsonObjects(block))
      : extractJsonObjects(content);

  const calls: ToolCall[] = [];
  for (const [i, candidate] of candidates.entries()) {
    try {
      const parsed = JSON.parse(candidate.trim());
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.name === "string"
      ) {
        const args =
          typeof parsed.arguments === "object" && parsed.arguments !== null
            ? parsed.arguments
            : {};
        calls.push(
          toToolCall(`fallback-${Date.now()}-${i}`, parsed.name, args),
        );
      }
    } catch {
      // Not parseable JSON — not a recoverable tool call.
    }
  }

  return calls;
}
