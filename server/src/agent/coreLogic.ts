import type { Sandbox } from "e2b";
import { config } from "./config";
import { executeTool } from "./tools/executer";
import { isMutatingTool, recordEvent } from "./eventLog";
import type { ChatMessage, LLMProvider, ToolSchema } from "./types";

/**
 * The bounded tool-call loop: ask the model, run whatever tools it asked for,
 * feed results back, repeat until it stops calling tools or we hit the step limit.
 * Mutates `messages` in place so the caller keeps full history.
 */
export async function runLoop(
  sessionId: string,
  sandbox: Sandbox,
  provider: LLMProvider,
  tools: ToolSchema[],
  messages: ChatMessage[]
): Promise<string> {
  let finalReply = "";

  for (let i = 0; i < config.maxAgentIterations; i++) {
    console.log(`[loop] step ${i + 1}/${config.maxAgentIterations} — calling model`);

    const result = await provider.chat(messages, tools);

    if (result.toolCalls.length === 0) {
      finalReply = result.content ?? "";
      console.log(`[loop] step ${i + 1} — model finished, no more tool calls`);
      messages.push({ role: "assistant", content: finalReply });
      break;
    }

    console.log(
      `[loop] step ${i + 1} — model requested ${result.toolCalls.length} tool call(s): ${result.toolCalls
        .map((c) => c.name)
        .join(", ")}`
    );

    messages.push({ role: "assistant", content: result.content, toolCalls: result.toolCalls });

    for (const call of result.toolCalls) {
      const output = await executeTool(sandbox, call);
      console.log(`[loop] step ${i + 1} — tool ${call.name} result: ${output.slice(0, 300)}`);
      messages.push({ role: "tool", content: output, toolCallId: call.id, name: call.name });

      // Only log successful, state-mutating calls — replaying a failed edit
      // or a pure read wouldn't do anything useful if we rebuild from this.
      if (isMutatingTool(call.name) && !output.startsWith("Error")) {
        recordEvent(sessionId, call);
      }
    }

    if (i === config.maxAgentIterations - 1) {
      finalReply = "Reached the step limit before finishing. Try again with a more specific request.";
      console.warn(`[loop] step limit (${config.maxAgentIterations}) reached without finishing`);
      messages.push({ role: "assistant", content: finalReply });
    }
  }

  return finalReply;
}
