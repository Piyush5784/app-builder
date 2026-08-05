import type {
  ChatMessage,
  LLMProvider,
  ProviderResponse,
  ToolSchema,
} from "@/agent/types";
import { toToolCall } from "@/agent/types";
import { logger } from "@/agent/telemetry";
import { extractFallbackToolCalls } from "@/agent/providers/tool-call-recovery";

interface OpenAIToolCallWire {
  id: string;
  function: { name: string; arguments: string };
}

interface OpenAIMessageWire {
  role: string;
  content: string | null;
  tool_calls?: OpenAIToolCallWire[];
  tool_call_id?: string;
}

interface OpenAIUsageWire {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenAIChatResponse {
  choices?: { message?: OpenAIMessageWire }[];
  usage?: OpenAIUsageWire;
  error?: { message: string; code?: number };
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
  providerLabel: string; // for log lines, e.g. "openrouter" or "ollama"
  url: string;
  headers?: Record<string, string>;
  model: string;
  maxAttempts?: number;
}

async function requestOnce(
  options: OpenAICompatOptions,
  body: string,
  signal?: AbortSignal,
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

  const data = (await res.json()) as OpenAIChatResponse;

  if (data.error)
    throw new Error(`${options.providerLabel} error: ${data.error.message}`);

  const message = data.choices?.[0]?.message;
  if (!message) {
    throw new Error(
      `${options.providerLabel} returned no message. Raw response: ${JSON.stringify(data).slice(0, 500)}`,
    );
  }

  const tokensIn = data.usage?.prompt_tokens;
  const tokensOut = data.usage?.completion_tokens;

  const toolCalls = (message.tool_calls ?? []).map((tc) =>
    toToolCall(tc.id, tc.function.name, safeParseJson(tc.function.arguments)),
  );

  if (toolCalls.length === 0 && message.content) {
    const recovered = extractFallbackToolCalls(message.content);
    if (recovered.length > 0) {
      logger.error(
        "provider",
        "model put tool call(s) in content instead of tool_calls, recovered",
        { recoveredCount: recovered.length },
      );
      return { content: null, toolCalls: recovered, tokensIn, tokensOut };
    }

    // Looks like a tool-call attempt but didn't parse as clean JSON — that's
    // a genuinely broken response, worth retrying rather than accepting.
    if (/<tool_call>|<function=/.test(message.content)) {
      throw new Error(
        `${options.providerLabel} emitted a malformed tool call as text instead of tool_calls: ${message.content.slice(0, 300)}`,
      );
    }
  }

  return { content: message.content ?? null, toolCalls, tokensIn, tokensOut };
}

/**
 * Any provider that speaks the OpenAI chat-completions wire format (OpenRouter,
 * Ollama's /v1 endpoint, etc.) is the same client with a different URL/headers/model —
 * so it's one factory, not one file per provider.
 */
export function createOpenAICompatProvider(
  options: OpenAICompatOptions,
): LLMProvider {
  return {
    providerLabel: options.providerLabel,
    model: options.model,

    async chat(messages, tools, signal): Promise<ProviderResponse> {
      const body = JSON.stringify({
        model: options.model,
        messages: toOpenAIMessages(messages),
        tools: toOpenAITools(tools),
        tool_choice: "auto",
        temperature: 0.2,
      });

      const maxAttempts = options.maxAttempts ?? 3;
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await requestOnce(options, body, signal);
        } catch (error) {
          lastError = error;
          // A deliberate cancellation, not a flaky response — retrying would
          // just fire another request the caller no longer wants.
          if (signal?.aborted) break;
          logger.error("provider", "attempt failed", {
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
