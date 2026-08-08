import type { ProviderName } from "@/agent/providers";
import {
  NVIDIA_MODEL,
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
  tier: "free" | "paid";
}

export const MODEL_REGISTRY: ModelOption[] = [
  {
    id: "nvidia",
    provider: "nvidia",
    model: NVIDIA_MODEL,
    label: "NVIDIA Nemotron",
    tier: "free",
  },
  {
    id: "gemini",
    provider: "gemini",
    model: GEMINI_MODEL,
    label: "Gemini 2.0 Flash",
    tier: "paid",
  },
  {
    id: "groq",
    provider: "groq",
    model: GROQ_MODEL,
    label: "Llama 3.3 70B (Groq)",
    tier: "paid",
  },
  {
    id: "openai",
    provider: "openai",
    model: OPENAI_MODEL,
    label: "GPT-4o mini",
    tier: "paid",
  },
  {
    id: "anthropic",
    provider: "anthropic",
    model: ANTHROPIC_MODEL,
    label: "Claude 3.5 Sonnet",
    tier: "paid",
  },
];

const MODEL_BY_ID = new Map(MODEL_REGISTRY.map((m) => [m.id, m]));

export function getModelOption(id: unknown): ModelOption | undefined {
  return typeof id === "string" ? MODEL_BY_ID.get(id) : undefined;
}

export const FREE_MODEL_CREDITS_PER_CALL = 0.5;
export const USD_PER_CREDIT = 0.01;
