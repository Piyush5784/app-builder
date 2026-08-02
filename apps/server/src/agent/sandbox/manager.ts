import { Sandbox } from "e2b";
import { SANDBOX_TIMEOUT_MS, E2B_TEMPLATE_ID } from "@/config";
import { logger } from "@/agent/telemetry";
import { upsertAgentSession, updateAgentSession } from "@/agent/persistence";

const E2B_DEV_PORT = 5173;

interface SandboxSession {
  sandbox: Sandbox;
  lastActiveAt: number;
}

const sandboxSessions: Record<string, SandboxSession> = {};

function isExpired(session: SandboxSession): boolean {
  return Date.now() - session.lastActiveAt > SANDBOX_TIMEOUT_MS;
}

export interface SandboxHandle {
  sandbox: Sandbox;
  isNew: boolean;
}

export async function getOrCreateSandbox(
  sessionId: string,
): Promise<SandboxHandle> {
  const existingSession = sandboxSessions[sessionId];

  if (existingSession && !isExpired(existingSession)) {
    try {
      await existingSession.sandbox.setTimeout(SANDBOX_TIMEOUT_MS); // extend the 30 min window
      existingSession.lastActiveAt = Date.now();
      await updateAgentSession(sessionId);
      logger.info("sandbox", "reused sandbox", {
        sessionId,
        sandboxId: existingSession.sandbox.sandboxId,
      });
      return { sandbox: existingSession.sandbox, isNew: false };
    } catch {
      // Expected when the old sandbox already died (idle timeout, restart) —
      // not an error worth a stack trace, just move on and create a fresh one.
      logger.info("sandbox", "previous sandbox is gone, creating a new one", {
        sessionId,
      });
      delete sandboxSessions[sessionId];
    }
  }

  logger.info("sandbox", "creating new sandbox", {
    sessionId,
    templateId: E2B_TEMPLATE_ID,
  });

  const newSandbox = await Sandbox.create(E2B_TEMPLATE_ID, {
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });

  sandboxSessions[sessionId] = {
    sandbox: newSandbox,
    lastActiveAt: Date.now(),
  };

  await upsertAgentSession(sessionId, newSandbox.sandboxId);

  logger.info("sandbox", "created", {
    sessionId,
    sandboxId: newSandbox.sandboxId,
  });

  return { sandbox: newSandbox, isNew: true };
}

export function getPreviewUrl(sandbox: Sandbox): string {
  return `https://${sandbox.getHost(E2B_DEV_PORT)}`;
}

export async function touchSession(sessionId: string): Promise<void> {
  const session = sandboxSessions[sessionId];
  if (session) session.lastActiveAt = Date.now();
  await updateAgentSession(sessionId);
}

export async function destroySandbox(sessionId: string): Promise<void> {
  const session = sandboxSessions[sessionId];
  if (!session) return;

  try {
    await session.sandbox.kill();
    logger.info("sandbox", "killed after error", {
      sessionId,
      sandboxId: session.sandbox.sandboxId,
    });
    delete sandboxSessions[sessionId];
  } catch (error) {
    logger.error("sandbox", "failed to kill", {
      sessionId,
      sandboxId: session.sandbox.sandboxId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
