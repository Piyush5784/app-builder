import { toToolCall, type ToolCall } from "@/agent/types";

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

// Extracts tool calls from the content, looking for <tool_call>...</tool_call> blocks first, and if none are found, attempts to extract JSON objects from the entire content. Each valid tool call is converted into a ToolCall object with a unique id.
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
