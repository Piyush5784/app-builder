import type { ProviderName } from "@/agent/providers";
import {
  NVIDIA_MODEL,
  NVIDIA_LIGHTNING_MODEL,
  GEMINI_MODEL,
  GROQ_MODEL,
  OPENAI_MODEL,
  ANTHROPIC_MODEL,
} from "@/config";

export interface ModelOption {
  id: string;
  provider: ProviderName;
  model: string;
  label: string;
}

// Every model is billed the same way — actual token usage, priced from
// ModelPricing (see agent-runtime.ts) — there's no separate free tier.
// Everyone starts with a $50 credit balance (User.credits' default).
const MODEL_REGISTRY: ModelOption[] = [
  {
    id: "nvidia",
    provider: "nvidia",
    model: NVIDIA_MODEL,
    label: "NVIDIA Nemotron Ultra",
  },
  {
    id: "nvidia-lightning",
    provider: "nvidiaLightning",
    model: NVIDIA_LIGHTNING_MODEL,
    label: "NVIDIA Nemotron Lightning",
  },
  {
    id: "gemini",
    provider: "gemini",
    model: GEMINI_MODEL,
    label: "Gemini 2.0 Flash",
  },
  {
    id: "groq",
    provider: "groq",
    model: GROQ_MODEL,
    label: "Llama 3.3 70B (Groq)",
  },
  {
    id: "openai",
    provider: "openai",
    model: OPENAI_MODEL,
    label: "GPT-4o mini",
  },
  {
    id: "anthropic",
    provider: "anthropic",
    model: ANTHROPIC_MODEL,
    label: "Claude 3.5 Sonnet",
  },
];

const MODEL_BY_ID = new Map(MODEL_REGISTRY.map((m) => [m.id, m]));

function getModelOption(id: unknown): ModelOption | undefined {
  return typeof id === "string" ? MODEL_BY_ID.get(id) : undefined;
}

const USD_PER_CREDIT = 0.01;

export const models = {
  MODEL_REGISTRY,
  getModelOption,
  USD_PER_CREDIT,
};
