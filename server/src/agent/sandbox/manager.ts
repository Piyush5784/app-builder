import { Sandbox } from "e2b";
import { config } from "../config";

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
      console.log(`[sandbox] reused sandbox ${existingSession.sandbox.sandboxId} for session ${sessionId}`);
      return { sandbox: existingSession.sandbox, isNew: false };
    } catch {
      // Expected when the old sandbox already died (idle timeout, restart) —
      // not an error worth a stack trace, just move on and create a fresh one.
      console.log(`[sandbox] session ${sessionId}'s previous sandbox is gone, creating a new one`);
      delete sandboxSessions[sessionId];
    }
  }

  console.log(`[sandbox] creating new sandbox for session ${sessionId} from template ${config.e2b.templateId}`);

  const newSandbox = await Sandbox.create(config.e2b.templateId, {
    timeoutMs: config.sandboxTimeoutMs,
  });

  sandboxSessions[sessionId] = {
    sandbox: newSandbox,
    lastActiveAt: Date.now(),
  };

  console.log(`[sandbox] created ${newSandbox.sandboxId} for session ${sessionId}`);

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
    console.log(`[sandbox] killed ${session.sandbox.sandboxId} for session ${sessionId} after error`);

    delete sandboxSessions[sessionId];
  } catch (error) {
    console.error(`[sandbox] failed to kill ${session.sandbox.sandboxId} for session ${sessionId}:`, error);
  }
}
