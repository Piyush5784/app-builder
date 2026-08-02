// --- server ---
export const PORT = process.env.PORT!;
export const NODE_ENV = process.env.NODE_ENV;
export const FRONTEND_URL = process.env.FRONTEND_URL!;

// --- auth (better-auth) ---
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL!;
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET!;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// --- email (resend) ---
export const RESEND_API_KEY = process.env.RESEND_API_KEY!;

// --- AI agent: provider + models ---
export const PROVIDER = process.env.PROVIDER ?? "openrouter";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-exp";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1/chat/completions";

// --- AI agent: sandbox (E2B) ---
export const E2B_API_KEY = process.env.E2B_API_KEY!;
export const E2B_TEMPLATE_ID = process.env.E2B_TEMPLATE_ID!;
export const SANDBOX_TIMEOUT_MS = Number(process.env.SANDBOX_TIMEOUT_MS ?? 10 * 60 * 1000);
export const MAX_AGENT_ITERATIONS = Number(process.env.MAX_AGENT_ITERATIONS ?? 6);
