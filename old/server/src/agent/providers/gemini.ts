import type { ChatMessage, LLMProvider, ProviderResponse, ToolSchema } from "@/agent/types";
import { toToolCall } from "@/agent/types";
import { config } from "@/agent/config";

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: object };
  functionResponse?: { name: string; response: { content: string } };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
}

function toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const m of messages) {
    if (m.role === "system") continue; // sent as systemInstruction instead

    if (m.role === "user") {
      contents.push({ role: "user", parts: [{ text: m.content ?? "" }] });
      continue;
    }

    if (m.role === "assistant") {
      const parts: GeminiPart[] = [];
      if (m.content) parts.push({ text: m.content });
      for (const tc of m.toolCalls ?? []) parts.push({ functionCall: { name: tc.name, args: tc.arguments } });
      contents.push({ role: "model", parts });
      continue;
    }

    if (m.role === "tool") {
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: m.name ?? "unknown", response: { content: m.content ?? "" } } }],
      });
    }
  }

  return contents;
}

function toGeminiTools(tools: ToolSchema[]) {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];
}

export const geminiProvider: LLMProvider = {
  async chat(messages, tools): Promise<ProviderResponse> {
    const systemMessage = messages.find((m) => m.role === "system");
    const url = `${config.gemini.baseUrl}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content ?? "" }] } : undefined,
        contents: toGeminiContents(messages),
        tools: toGeminiTools(tools),
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as GeminiResponse;
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    const textPart = parts.find((p) => p.text)?.text ?? null;
    const toolCalls = parts
      .filter((p) => p.functionCall)
      .map((p, i) =>
        toToolCall(`${Date.now()}-${i}`, p.functionCall!.name, p.functionCall!.args as Record<string, unknown>)
      );

    return { content: textPart, toolCalls };
  },
};
