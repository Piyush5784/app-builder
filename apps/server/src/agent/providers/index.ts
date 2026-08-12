import type { LLMProvider } from "@/agent/types";
import { createOpenAICompatProvider } from "@/agent/providers/openai-compat";
import { geminiProvider } from "@/agent/providers/gemini";
import { anthropicProvider } from "@/agent/providers/anthropic";
import {
  NVIDIA_API_KEY,
  NVIDIA_MODEL,
  NVIDIA_LIGHTNING_MODEL,
  GROQ_API_KEY,
  GROQ_MODEL,
  OPENAI_API_KEY,
  OPENAI_MODEL,
} from "@/config";

// One provider per MODEL_REGISTRY entry (see agent/models.ts) — every model
// is pinned to exactly one provider, so there's no separate configurable
// "default provider" concept. NVIDIA has two: "nvidia" (Ultra, highest
// quality) and "nvidiaLightning" (Lightning, same API/key, a much smaller
// active-params model chosen for speed) — both free under the same key.
export type ProviderName =
  "gemini" | "nvidia" | "nvidiaLightning" | "groq" | "openai" | "anthropic";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

const nvidiaProvider = createOpenAICompatProvider({
  providerLabel: "nvidia",
  url: NVIDIA_BASE_URL,
  model: NVIDIA_MODEL,
  headers: {
    Authorization: `Bearer ${NVIDIA_API_KEY}`,
  },
});

const nvidiaLightningProvider = createOpenAICompatProvider({
  providerLabel: "nvidiaLightning",
  url: NVIDIA_BASE_URL,
  model: NVIDIA_LIGHTNING_MODEL,
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

// The provider always comes from the caller's resolved ModelOption (see
// agent-runtime.ts) — no env-var-based default, since a model is always
// selected before this is called.
function getProvider(name: ProviderName): LLMProvider {
  switch (name) {
    case "gemini":
      return geminiProvider;
    case "nvidia":
      return nvidiaProvider;
    case "nvidiaLightning":
      return nvidiaLightningProvider;
    case "groq":
      return groqProvider;
    case "openai":
      return openaiProvider;
    case "anthropic":
      return anthropicProvider;
  }
}

export const providers = { getProvider };
