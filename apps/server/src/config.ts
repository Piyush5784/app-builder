// --- server ---
export const PORT = process.env.PORT!;
export const NODE_ENV = process.env.NODE_ENV;
export const FRONTEND_URL = process.env.FRONTEND_URL!;

// --- redis (Upstash — shared rate-limit store, see lib/redis.ts) ---
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL!;
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

// --- auth (better-auth) ---
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL!;
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET!;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// --- email (resend) ---
export const RESEND_API_KEY = process.env.RESEND_API_KEY!;

// --- AI agent: providers + models ---
// Model versions are pinned here, not env-configurable — which model runs
// is decided entirely by which MODEL_REGISTRY entry (agent/models.ts) was
// selected, one model per provider, not by an env-var override.
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
export const GEMINI_MODEL = "gemini-2.0-flash-exp";
export const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY!;
export const NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
export const GROQ_API_KEY = process.env.GROQ_API_KEY!;
export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
export const OPENAI_MODEL = "gpt-4o-mini";
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
export const ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";

// --- AI agent: sandbox (E2B) ---
export const E2B_API_KEY = process.env.E2B_API_KEY!;
export const E2B_TEMPLATE_ID = process.env.E2B_TEMPLATE_ID!;
export const SANDBOX_TIMEOUT_MS = Number(
  process.env.SANDBOX_TIMEOUT_MS ?? 10 * 60 * 1000,
);
