import express from "express";
import cors from "cors";
import { runAgent, getSandboxUrl, type ProviderName } from "./agent";

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

  if(!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "Invalid sessionId" });
    return;
  }

  try {
    console.log(`[http] GET /api/sandbox/${sessionId}`);
    const result = await getSandboxUrl(sessionId);
    res.json(result);
  } catch (error) {
    console.error(`[http] error opening sandbox for session ${sessionId}:`, error);
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
  const providerName: ProviderName | undefined = "ollama"

  console.log(`[http] POST /api/prompt — session=${sId}`);

  let responded = false;

  runAgent(sId, prompt, providerName, (previewUrl) => {
    responded = true;
    console.log(`[http] POST /api/prompt — session=${sId} sandbox ready, responding early`);
    res.json({ sessionId: sId, previewUrl });
  })
    .then((result) => {
      console.log(`[http] POST /api/prompt — session=${sId} agent finished: "${result.reply}"`);
      if (!responded) {
        res.json(result);
      }
    })
    .catch((error) => {
      console.error("[http] error processing prompt:", error);
      if (!responded) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
