import type {
  ChatMessage,
  LLMProvider,
  ProviderResponse,
  ToolSchema,
} from "@/agent/types";
import { toToolCall } from "@/agent/types";
import { telemetry } from "@/agent/telemetry";
import { extractFallbackToolCalls } from "@/agent/providers/tool-call-recovery";

interface OpenAIUsageWire {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenAIStreamToolCallDelta {
  index: number;
  id?: string;
  function?: { name?: string; arguments?: string };
}

interface OpenAIStreamDelta {
  content?: string | null;
  reasoning_content?: string | null;
  tool_calls?: OpenAIStreamToolCallDelta[];
}

interface OpenAIStreamChunk {
  choices?: { delta?: OpenAIStreamDelta }[];
  usage?: OpenAIUsageWire;
  error?: { message: string; code?: number };
}

interface OpenAIMessageWire {
  role: string;
  content: string | null;
  tool_calls?: { id: string; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

function toOpenAIMessages(messages: ChatMessage[]): OpenAIMessageWire[] {
  return messages.map((m): OpenAIMessageWire => {
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      };
    }
    if (m.role === "tool") {
      return {
        role: "tool",
        tool_call_id: m.toolCallId,
        content: m.content ?? "",
      };
    }
    return { role: m.role, content: m.content };
  });
}

function toOpenAITools(tools: ToolSchema[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

function safeParseJson(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export interface OpenAICompatOptions {
  providerLabel: string;
  url: string;
  headers?: Record<string, string>;
  model: string;
  maxAttempts?: number;
  thinking?: boolean;
}

interface StreamToolCallAccumulator {
  id?: string;
  name?: string;
  arguments: string;
}

interface StreamState {
  startedEmitting: boolean;
}

async function requestOnceStreaming(
  options: OpenAICompatOptions,
  body: string,
  signal: AbortSignal | undefined,
  onToken:
    ((delta: string, kind?: "content" | "reasoning") => void) | undefined,
  state: StreamState,
): Promise<ProviderResponse> {
  const res = await fetch(options.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...options.headers },
    body,
    signal,
  });

  if (!res.ok)
    throw new Error(
      `${options.providerLabel} error ${res.status}: ${await res.text()}`,
    );

  if (!res.body)
    throw new Error(
      `${options.providerLabel} returned no response body for a streaming request`,
    );

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let reasoning = "";
  let tokensIn: number | undefined;
  let tokensOut: number | undefined;
  const toolCallsByIndex = new Map<number, StreamToolCallAccumulator>();

  const processLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;

    let parsed: OpenAIStreamChunk;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return;
    }

    if (parsed.error) {
      throw new Error(
        `${options.providerLabel} error: ${parsed.error.message}`,
      );
    }

    if (parsed.usage) {
      tokensIn = parsed.usage.prompt_tokens;
      tokensOut = parsed.usage.completion_tokens;
    }

    const delta = parsed.choices?.[0]?.delta;
    if (!delta) return;

    if (delta.content) {
      content += delta.content;
      state.startedEmitting = true;
      onToken?.(delta.content, "content");
    }

    if (delta.reasoning_content) {
      reasoning += delta.reasoning_content;
      state.startedEmitting = true;
      onToken?.(delta.reasoning_content, "reasoning");
    }

    for (const tc of delta.tool_calls ?? []) {
      state.startedEmitting = true;
      const existing = toolCallsByIndex.get(tc.index) ?? { arguments: "" };
      if (tc.id) existing.id = tc.id;
      if (tc.function?.name) existing.name = tc.function.name;
      if (tc.function?.arguments) existing.arguments += tc.function.arguments;
      toolCallsByIndex.set(tc.index, existing);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of frame.split("\n")) processLine(line);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const toolCalls = Array.from(toolCallsByIndex.entries())
    .sort(([a], [b]) => a - b)
    .map(([, tc]) =>
      toToolCall(
        tc.id ?? `stream-${Date.now()}`,
        tc.name ?? "",
        safeParseJson(tc.arguments),
      ),
    );

  if (toolCalls.length === 0 && content) {
    const recovered = extractFallbackToolCalls(content);
    if (recovered.length > 0) {
      telemetry.logger.error(
        "provider",
        "model put tool call(s) in content instead of tool_calls, recovered",
        { recoveredCount: recovered.length },
      );
      return {
        content: null,
        reasoning: reasoning || undefined,
        toolCalls: recovered,
        tokensIn,
        tokensOut,
      };
    }

    if (/<tool_call>|<function=/.test(content)) {
      throw new Error(
        `${options.providerLabel} emitted a malformed tool call as text instead of tool_calls: ${content.slice(0, 300)}`,
      );
    }
  }

  return {
    content: content || null,
    reasoning: reasoning || undefined,
    toolCalls,
    tokensIn,
    tokensOut,
  };
}

export function createOpenAICompatProvider(
  options: OpenAICompatOptions,
): LLMProvider {
  return {
    providerLabel: options.providerLabel,
    model: options.model,

    async chat(messages, tools, signal, onToken): Promise<ProviderResponse> {
      const body = JSON.stringify({
        model: options.model,
        messages: toOpenAIMessages(messages),
        tools: toOpenAITools(tools),
        tool_choice: "auto",
        temperature: 0.2,
        stream: true,
        stream_options: { include_usage: true },
        ...(options.thinking && {
          chat_template_kwargs: { thinking: true },
        }),
      });

      const maxAttempts = options.maxAttempts ?? 3;
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const state: StreamState = { startedEmitting: false };
        try {
          return await requestOnceStreaming(
            options,
            body,
            signal,
            onToken,
            state,
          );
        } catch (error) {
          lastError = error;
          if (signal?.aborted) break;
          if (state.startedEmitting) break;
          telemetry.logger.error("provider", "attempt failed", {
            provider: options.providerLabel,
            attempt,
            maxAttempts,
            error: error instanceof Error ? error.message : String(error),
          });
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 700));
          }
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error(String(lastError));
    },
  };
}
