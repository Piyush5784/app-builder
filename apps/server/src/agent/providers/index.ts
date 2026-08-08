import type { LLMProvider } from "@/agent/types";
import { createOpenAICompatProvider } from "@/agent/providers/openai-compat";
import { geminiProvider } from "@/agent/providers/gemini";
import { anthropicProvider } from "@/agent/providers/anthropic";
import {
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
  OLLAMA_MODEL,
  OLLAMA_BASE_URL,
  NVIDIA_API_KEY,
  NVIDIA_MODEL,
  GROQ_API_KEY,
  GROQ_MODEL,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  PROVIDER,
} from "@/config";

export type ProviderName =
  | "openrouter"
  | "gemini"
  | "ollama"
  | "nvidia"
  | "groq"
  | "openai"
  | "anthropic";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

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

const nvidiaProvider = createOpenAICompatProvider({
  providerLabel: "nvidia",
  url: NVIDIA_BASE_URL,
  model: NVIDIA_MODEL,
  headers: {
    Authorization: `Bearer ${NVIDIA_API_KEY}`,
  },
});

const groqProvider = createOpenAICompatProvider({
  providerLabel: "groq",
  url: GROQ_BASE_URL,
  model: GROQ_MODEL,
  headers: {
    Authorization: `Bearer ${GROQ_API_KEY}`,
  },
});

const openaiProvider = createOpenAICompatProvider({
  providerLabel: "openai",
  url: OPENAI_BASE_URL,
  model: OPENAI_MODEL,
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  },
});

function getProvider(name?: ProviderName): LLMProvider {
  switch (name ?? PROVIDER) {
    case "gemini":
      return geminiProvider;
    case "ollama":
      return ollamaProvider;
    case "nvidia":
      return nvidiaProvider;
    case "groq":
      return groqProvider;
    case "openai":
      return openaiProvider;
    case "anthropic":
      return anthropicProvider;
    case "openrouter":
      return openRouterProvider;
    default:
      return openRouterProvider;
  }
}

export const providers = { getProvider };
