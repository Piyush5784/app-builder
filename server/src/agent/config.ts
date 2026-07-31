export const config = {
  port: Number(process.env.PORT ?? 4000),
  provider: (process.env.PROVIDER ?? "openrouter") as "openrouter" | "gemini" | "ollama",

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    model: process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash-exp",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  },

  ollama: {
    model: process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1/chat/completions",
  },

  e2b: {
    apiKey: process.env.E2B_API_KEY ?? "",
    templateId: process.env.E2B_TEMPLATE_ID ?? "lovable-v1-react-ts",
    appDir: "/home/user/app",
    devPort: 5173,
  },

  sandboxTimeoutMs: Number(process.env.SANDBOX_TIMEOUT_MS ?? 10 * 60 * 1000), 
  maxAgentIterations: Number(process.env.MAX_AGENT_ITERATIONS ?? 6),
};
