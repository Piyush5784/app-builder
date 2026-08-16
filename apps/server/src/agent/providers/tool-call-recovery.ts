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

/**
 * WHY:
 * Some models (observed with NVIDIA Nemotron) emit tool calls as this
 * pseudo-XML instead of clean JSON:
 *   <tool_call> <function=listFiles> <parameter=path> src </parameter> </function> </tool_call>
 * One <function=...> block per call, zero or more <parameter=key>value</parameter>
 * children inside it. Extracted separately from extractJsonObjects since this
 * isn't JSON at all.
 */
function extractXmlFunctionCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const functionRe = /<function=([^>]+)>([\s\S]*?)<\/function>/g;
  const paramRe = /<parameter=([^>]+)>([\s\S]*?)<\/parameter>/g;

  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = functionRe.exec(content)) !== null) {
    const name = match[1]?.trim();
    const body = match[2] ?? "";
    if (!name) continue;

    const args: Record<string, unknown> = {};
    let paramMatch: RegExpExecArray | null;
    paramRe.lastIndex = 0;
    while ((paramMatch = paramRe.exec(body)) !== null) {
      const key = paramMatch[1]?.trim();
      const value = paramMatch[2]?.trim();
      if (key) args[key] = value ?? "";
    }

    try {
      calls.push(toToolCall(`fallback-${Date.now()}-${i}`, name, args));
    } catch {
      // not a recoverable call
    }
    i++;
  }

  return calls;
}

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
      // not parseable JSON
    }
  }

  if (calls.length === 0) {
    return extractXmlFunctionCalls(content);
  }

  return calls;
}
