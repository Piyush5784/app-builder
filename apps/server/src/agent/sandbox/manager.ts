import { Sandbox } from "e2b";
import { ZipArchive, type Archiver } from "archiver";
import { SANDBOX_TIMEOUT_MS, E2B_TEMPLATE_ID } from "@/config";
import { logger } from "@/agent/telemetry";
import {
  getAgentSessionOwnerId,
  upsertAgentSession,
  updateAgentSession,
} from "@/agent/persistence";
import { replayEvents, resolvePath } from "@/agent/tools";
import { getEvents } from "@/agent/core/event-log";
import { buildFileTree, type FileTreeNode } from "@/agent/sandbox/file-tree";

const E2B_DEV_PORT = 5173;

interface SandboxSession {
  sandbox: Sandbox;
  lastActiveAt: number;
}

const sandboxSessions: Record<string, SandboxSession> = {};

function isExpired(session: SandboxSession): boolean {
  return Date.now() - session.lastActiveAt > SANDBOX_TIMEOUT_MS;
}

export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} does not exist`);
    this.name = "SessionNotFoundError";
  }
}

export interface SandboxHandle {
  sandbox: Sandbox;
  isNew: boolean;
}

export async function getOrCreateSandbox(
  sessionId: string,
  allowCreate: boolean,
  userId: string,
): Promise<SandboxHandle> {
  // Checked unconditionally, even before the warm in-memory path below —
  // otherwise a logged-in user who merely knows/guesses another user's
  // sessionId could ride their still-warm sandbox with no ownership check
  // at all. Never distinguish "exists but isn't yours" from "doesn't
  // exist" in the error, so session ids can't be probed for existence.
  const ownerId = await getAgentSessionOwnerId(sessionId);
  if (ownerId !== null && ownerId !== userId) {
    throw new SessionNotFoundError(sessionId);
  }
  if (ownerId === null && !allowCreate) {
    throw new SessionNotFoundError(sessionId);
  }

  const existingSession = sandboxSessions[sessionId];

  if (existingSession && !isExpired(existingSession)) {
    try {
      await existingSession.sandbox.setTimeout(SANDBOX_TIMEOUT_MS); // extend the 30 min window
      existingSession.lastActiveAt = Date.now();
      await updateAgentSession(sessionId);
      return { sandbox: existingSession.sandbox, isNew: false };
    } catch {
      // Expected when the old sandbox already died (idle timeout, restart) —
      // not an error worth a stack trace, just move on and create a fresh one.
      delete sandboxSessions[sessionId];
    }
  }

  const newSandbox = await Sandbox.create(E2B_TEMPLATE_ID, {
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });

  sandboxSessions[sessionId] = {
    sandbox: newSandbox,
    lastActiveAt: Date.now(),
  };

  await upsertAgentSession(sessionId, newSandbox.sandboxId, userId);

  return { sandbox: newSandbox, isNew: true };
}

export function getPreviewUrl(sandbox: Sandbox): string {
  return `https://${sandbox.getHost(E2B_DEV_PORT)}`;
}

export async function updateSession(sessionId: string): Promise<void> {
  const session = sandboxSessions[sessionId];
  if (session) session.lastActiveAt = Date.now();
  await updateAgentSession(sessionId);
}

export async function destroySandbox(sessionId: string): Promise<void> {
  const session = sandboxSessions[sessionId];
  if (!session) return;

  try {
    await session.sandbox.kill();
    delete sandboxSessions[sessionId];
  } catch (error) {
    logger.error("sandbox", "failed to kill", {
      sandboxId: session.sandbox.sandboxId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Gets or creates the session's sandbox and, if it's a fresh one, replays
 * its recorded events onto it. Shared by the agent loop and the plain
 * sandbox-reopen / file-browsing routes — no LLM call happens here.
 */
export async function openSandbox(
  sessionId: string,
  allowCreate: boolean,
  userId: string,
): Promise<{ sandbox: Sandbox; previewUrl: string }> {
  const { sandbox, isNew } = await getOrCreateSandbox(
    sessionId,
    allowCreate,
    userId,
  );

  if (isNew) {
    const priorEvents = await getEvents(sessionId);
    if (priorEvents.length > 0) {
      try {
        await replayEvents(sandbox, priorEvents);
      } catch (error) {
        logger.error("sandbox", "replay failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        await destroySandbox(sessionId);
        throw error;
      }
    }
  }

  const previewUrl = getPreviewUrl(sandbox);
  return { sandbox, previewUrl };
}

/**
 * Reopens a session's sandbox (creating + replaying it if the old one died)
 * and returns its preview URL. No LLM call, no tool loop — just the sandbox.
 */
export async function getSandboxUrl(
  sessionId: string,
  userId: string,
): Promise<{ sessionId: string; previewUrl: string }> {
  const { previewUrl } = await openSandbox(sessionId, false, userId);
  return { sessionId, previewUrl };
}

/**
 * The recursive file/folder listing behind the workspace's code view. Never
 * creates a sandbox for a session that doesn't exist — same reopen-only
 * semantics as getSandboxUrl.
 */
export async function listSandboxFiles(
  sessionId: string,
  userId: string,
): Promise<FileTreeNode[]> {
  const { sandbox } = await openSandbox(sessionId, false, userId);
  return buildFileTree(sandbox);
}

/** Reads one file's content for the code view. Reopen-only, same as above. */
export async function readSandboxFile(
  sessionId: string,
  path: string,
  userId: string,
): Promise<string> {
  const { sandbox } = await openSandbox(sessionId, false, userId);
  const content = await sandbox.files.read(resolvePath(path));
  return typeof content === "string" ? content : String(content);
}

function collectFilePaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.type === "dir") {
      if (node.children) paths.push(...collectFilePaths(node.children));
    } else {
      paths.push(node.path);
    }
  }
  return paths;
}

/**
 * Zips every file in the sandbox for a single "download all" button. Reads
 * as raw bytes (not text) so binary files — images, fonts — don't get
 * corrupted by a text decode/re-encode round trip.
 */
export async function downloadSandboxZip(
  sessionId: string,
  userId: string,
): Promise<Archiver> {
  const { sandbox } = await openSandbox(sessionId, false, userId);
  const tree = await buildFileTree(sandbox);
  const filePaths = collectFilePaths(tree);

  const archive = new ZipArchive({ zlib: { level: 9 } });

  for (const path of filePaths) {
    const content = await sandbox.files.read(resolvePath(path), {
      format: "bytes",
    });
    archive.append(Buffer.from(content), { name: path });
  }

  void archive.finalize();
  return archive;
}
