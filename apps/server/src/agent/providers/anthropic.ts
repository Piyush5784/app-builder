import type {
  ChatMessage,
  LLMProvider,
  ProviderResponse,
  ToolSchema,
} from "@/agent/types";
import { toToolCall } from "@/agent/types";
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from "@/config";

const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TOKENS = 8192;

interface AnthropicTextBlock {
  type: "text";
  text: string;
}
interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}
interface AnthropicToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}
type AnthropicContentBlock =
  AnthropicTextBlock | AnthropicToolUseBlock | AnthropicToolResultBlock;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message: string };
}

function toAnthropicMessages(messages: ChatMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];

  for (const m of messages) {
    if (m.role === "system") continue; // sent as top-level `system` instead

    if (m.role === "user") {
      result.push({ role: "user", content: m.content ?? "" });
      continue;
    }

    if (m.role === "assistant") {
      const blocks: AnthropicContentBlock[] = [];
      if (m.content) blocks.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls ?? []) {
        blocks.push({
          type: "tool_use",
          id: tc.id,
          name: tc.name,
          input: tc.arguments,
        });
      }
      result.push({ role: "assistant", content: blocks });
      continue;
    }

    if (m.role === "tool") {
      result.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: m.toolCallId ?? "",
            content: m.content ?? "",
          },
        ],
      });
    }
  }

  return result;
}

function toAnthropicTools(tools: ToolSchema[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));
}

export const anthropicProvider: LLMProvider = {
  providerLabel: "anthropic",
  model: ANTHROPIC_MODEL,

  async chat(messages, tools, signal, onToken): Promise<ProviderResponse> {
    const systemMessage = messages.find((m) => m.role === "system");

    const res = await fetch(ANTHROPIC_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemMessage?.content ?? undefined,
        messages: toAnthropicMessages(messages),
        tools: toAnthropicTools(tools),
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as AnthropicResponse;
    if (data.error) throw new Error(`Anthropic error: ${data.error.message}`);

    const blocks = data.content ?? [];
    const textBlock = blocks.find(
      (b): b is AnthropicTextBlock => b.type === "text",
    );
    const toolCalls = blocks
      .filter((b): b is AnthropicToolUseBlock => b.type === "tool_use")
      .map((b) => toToolCall(b.id, b.name, b.input as Record<string, unknown>));

    if (textBlock?.text) onToken?.(textBlock.text);

    return {
      content: textBlock?.text ?? null,
      toolCalls,
      tokensIn: data.usage?.input_tokens,
      tokensOut: data.usage?.output_tokens,
    };
  },
};
