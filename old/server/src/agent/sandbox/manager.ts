import { Sandbox } from "e2b";
import { config } from "@/agent/config";
import { logger } from "@/agent/telemetry";

interface SandboxSession {
  sandbox: Sandbox;
  lastActiveAt: number;
}

const sandboxSessions: Record<string, SandboxSession> = {};

function isExpired(session: SandboxSession): boolean {
  return Date.now() - session.lastActiveAt > config.sandboxTimeoutMs;
}

export interface SandboxHandle {
  sandbox: Sandbox;
  isNew: boolean;
}

export async function getOrCreateSandbox(sessionId: string): Promise<SandboxHandle> {
  const existingSession = sandboxSessions[sessionId];

  if (existingSession && !isExpired(existingSession)) {
    try {
      await existingSession.sandbox.setTimeout(config.sandboxTimeoutMs); // extend the 30 min window
      existingSession.lastActiveAt = Date.now();
      logger.info("sandbox", "reused sandbox", { sessionId, sandboxId: existingSession.sandbox.sandboxId });
      return { sandbox: existingSession.sandbox, isNew: false };
    } catch {
      // Expected when the old sandbox already died (idle timeout, restart) —
      // not an error worth a stack trace, just move on and create a fresh one.
      logger.info("sandbox", "previous sandbox is gone, creating a new one", { sessionId });
      delete sandboxSessions[sessionId];
    }
  }

  logger.info("sandbox", "creating new sandbox", { sessionId, templateId: config.e2b.templateId });

  const newSandbox = await Sandbox.create(config.e2b.templateId, {
    timeoutMs: config.sandboxTimeoutMs,
  });

  sandboxSessions[sessionId] = {
    sandbox: newSandbox,
    lastActiveAt: Date.now(),
  };

  logger.info("sandbox", "created", { sessionId, sandboxId: newSandbox.sandboxId });

  return { sandbox: newSandbox, isNew: true };
}

export function getPreviewUrl(sandbox: Sandbox): string {
  return `https://${sandbox.getHost(config.e2b.devPort)}`;
}

export function touchSession(sessionId: string): void {
  const session = sandboxSessions[sessionId];
  if (session) session.lastActiveAt = Date.now();
}

export async function destroySandbox(sessionId: string): Promise<void> {
  const session = sandboxSessions[sessionId];
  if (!session) return;

  try {
    await session.sandbox.kill();
    logger.info("sandbox", "killed after error", { sessionId, sandboxId: session.sandbox.sandboxId });
    delete sandboxSessions[sessionId];
  } catch (error) {
    logger.error("sandbox", "failed to kill", {
      sessionId,
      sandboxId: session.sandbox.sandboxId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
