import type { LLMProvider } from "@/agent/types";
import { createOpenAICompatProvider } from "@/agent/providers/openai-compat";
import { geminiProvider } from "@/agent/providers/gemini";
import { OPENROUTER_API_KEY, OPENROUTER_MODEL, OLLAMA_MODEL, OLLAMA_BASE_URL, PROVIDER } from "@/config";

export type ProviderName = "openrouter" | "gemini" | "ollama";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const openRouterProvider = createOpenAICompatProvider({
  providerLabel: "openrouter",
  url: OPENROUTER_BASE_URL,
  model: OPENROUTER_MODEL,
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "HTTP-Referer": "http://localhost",
    "X-Title": "lovable-clone",
  },
});

const ollamaProvider = createOpenAICompatProvider({
  providerLabel: "ollama",
  url: OLLAMA_BASE_URL,
  model: OLLAMA_MODEL,
});

export function getProvider(name?: ProviderName): LLMProvider {
  switch (name ?? PROVIDER) {
    case "gemini":
      return geminiProvider;
    case "ollama":
      return ollamaProvider;
    case "openrouter":
      return openRouterProvider;
    default:
      return openRouterProvider;
  }
}
