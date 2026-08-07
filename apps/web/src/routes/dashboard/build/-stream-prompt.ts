import type { AgentEvent } from "@package/shared";
import { BACKEND_URL } from "@/config";

export interface StreamPromptArgs {
  prompt: string;
  sessionId?: string;
}

// POSTs to /agent/prompt and reads the response as one long-lived stream of
// SSE frames, calling `onEvent` for each as it arrives. The whole run —
// sandbox status, tokens, tool calls, completion — comes back on this one
// connection, in order, so there's nothing else to subscribe to.
export async function streamPrompt(
  { prompt, sessionId }: StreamPromptArgs,
  onEvent: (event: AgentEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/agent/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ prompt, sessionId }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Failed to start generation (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let frameEnd: number;
    while ((frameEnd = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, frameEnd);
      buffer = buffer.slice(frameEnd + 2);

      const dataLine = frame
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;

      const payload = dataLine.slice("data:".length).trim();
      if (payload) onEvent(JSON.parse(payload) as AgentEvent);
    }
  }
}
