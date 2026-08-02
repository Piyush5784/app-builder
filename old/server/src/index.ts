import express from "express";
import cors from "cors";
import { runAgent, getSandboxUrl, type ProviderName } from "@/agent";
import { logger } from "@/agent/telemetry";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Reopens a session's sandbox (replaying its recorded changes if the old one
// died) and returns its preview URL. No LLM call — just the sandbox.
app.get("/api/sandbox/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "Invalid sessionId" });
    return;
  }

  try {
    logger.info("http", "GET /api/sandbox", { sessionId });
    const result = await getSandboxUrl(sessionId);
    res.json(result);
  } catch (error) {
    logger.error("http", "error opening sandbox", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/prompt", (req, res) => {
  const { prompt, sessionId, provider } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Invalid prompt" });
    return;
  }

  const sId = sessionId && typeof sessionId === "string" ? sessionId : crypto.randomUUID();
  const providerName: ProviderName | undefined =
    provider === "gemini" || provider === "openrouter" || provider === "ollama" ? provider : undefined;

  logger.info("http", "POST /api/prompt", { sessionId: sId });

  let responded = false;

  runAgent(sId, prompt, providerName, (previewUrl) => {
    responded = true;
    logger.info("http", "sandbox ready, responding early", { sessionId: sId });
    res.json({ sessionId: sId, previewUrl });
  })
    .then((result) => {
      logger.info("http", "agent finished", { sessionId: sId, reply: result.reply });
      if (!responded) {
        res.json(result);
      }
    })
    .catch((error) => {
      logger.error("http", "error processing prompt", {
        sessionId: sId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!responded) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
});

app.listen(3000, () => {
  logger.info("http", "server running", { port: 3000 });
});
