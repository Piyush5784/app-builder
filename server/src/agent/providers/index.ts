import type { LLMProvider } from "../types";
import { createOpenAICompatProvider } from "./openaiCompat";
import { geminiProvider } from "./gemini";
import { config } from "../config";

export type ProviderName = "openrouter" | "gemini" | "ollama";

const openRouterProvider = createOpenAICompatProvider({
  providerLabel: "openrouter",
  url: config.openrouter.baseUrl,
  model: config.openrouter.model,
  headers: {
    Authorization: `Bearer ${config.openrouter.apiKey}`,
    "HTTP-Referer": "http://localhost",
    "X-Title": "lovable-clone",
  },
});

const ollamaProvider = createOpenAICompatProvider({
  providerLabel: "ollama",
  url: config.ollama.baseUrl,
  model: config.ollama.model,
});

export function getProvider(name?: ProviderName): LLMProvider {
  switch (name ?? config.provider) {
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
