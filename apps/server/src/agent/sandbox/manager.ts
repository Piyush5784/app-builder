import { Sandbox } from "e2b";
import { ZipArchive, type Archiver } from "archiver";
import { SANDBOX_TIMEOUT_MS, E2B_TEMPLATE_ID } from "@/config";
import { telemetry } from "@/agent/telemetry";
import { persistence } from "@/agent/persistence";
import { executer } from "@/agent/tools/executer";
import { eventLog } from "@/agent/core/event-log";
import { fileTree, type FileTreeNode } from "@/agent/sandbox/file-tree";

const E2B_DEV_PORT = 5173;

export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} does not exist`);
    this.name = "SessionNotFoundError";
  }
}

export class SandboxNotCreatedError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} has no sandbox yet`);
    this.name = "SandboxNotCreatedError";
  }
}

export interface SandboxHandle {
  sandbox: Sandbox;
  isNew: boolean;
}

/**
 * WHY:
 * No in-process cache — `AgentSession.sandboxId` + `lastActiveAt` in the DB
 * is the only source of truth for which E2B sandbox belongs to a session.
 * Any request can be served by any server process (no sticky routing, safe
 * to restart or run more than one instance) because nothing about a live
 * sandbox connection lives only in one process's memory.
 *
 * CONTEXT:
 * `Sandbox.connect(sandboxId)` reconnects to an already-running remote
 * sandbox by id — if it's died (idle timeout, crash) this throws and falls
 * through to creating a fresh one, same fallback the old in-memory version
 * had for a cached handle that stopped responding.
 *
 * DB writes: AgentSession — updateMany (lastActiveAt) on the warm reconnect
 * path, or upsert (create/refresh) once a new sandbox is up.
 */
async function getOrCreateSandbox(
  sessionId: string,
  allowCreate: boolean,
  userId: string,
): Promise<SandboxHandle> {
  const existing = await persistence.agentSessions.findUnique({
    where: { id: sessionId },
    select: { userId: true, sandboxId: true, lastActiveAt: true },
  });

  if (existing !== null && existing.userId !== userId) {
    throw new SessionNotFoundError(sessionId);
  }
  if (existing === null && !allowCreate) {
    throw new SessionNotFoundError(sessionId);
  }
  if (existing !== null && existing.sandboxId === null && !allowCreate) {
    throw new SandboxNotCreatedError(sessionId);
  }

  const isExpired =
    existing !== null &&
    Date.now() - existing.lastActiveAt.getTime() > SANDBOX_TIMEOUT_MS;

  if (existing !== null && existing.sandboxId !== null && !isExpired) {
    try {
      const sandbox = await Sandbox.connect(existing.sandboxId);
      await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
      await persistence.agentSessions.updateMany({
        where: { id: sessionId },
        data: { lastActiveAt: new Date() },
      });
      return { sandbox, isNew: false };
    } catch {
      // fall through to creating a fresh sandbox
    }
  }

  const newSandbox = await Sandbox.create(E2B_TEMPLATE_ID, {
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });

  await persistence.agentSessions.upsert({
    where: { id: sessionId },
    create: { id: sessionId, sandboxId: newSandbox.sandboxId, userId },
    update: { sandboxId: newSandbox.sandboxId, lastActiveAt: new Date() },
  });

  return { sandbox: newSandbox, isNew: true };
}

async function ensureSessionExists(
  sessionId: string,
  userId: string,
): Promise<void> {
  await persistence.agentSessions.upsert({
    where: { id: sessionId },
    create: { id: sessionId, userId },
    update: {},
  });
}

function getPreviewUrl(sandbox: Sandbox): string {
  return `https://${sandbox.getHost(E2B_DEV_PORT)}`;
}

async function updateSession(sessionId: string): Promise<void> {
  await persistence.agentSessions.updateMany({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
}

/**
 * WHY:
 * Vite's dev server (started once at sandbox boot) watches the filesystem
 * for changes, but writes made through E2B's file API don't reliably raise
 * the inotify events that watcher depends on — so it can keep serving stale
 * content indefinitely after the agent edits files. A full restart forces it
 * to re-read everything from disk; Vite's own HMR client then reloads the
 * preview automatically once it reconnects to the new process.
 *
 * CONTEXT:
 * Killing by port rather than by the tracked start-command pid, since `npm
 * run dev` spawns Vite as a child process and killing just the npm pid can
 * leave Vite itself still holding the port.
 */
async function restartDevServer(sandbox: Sandbox): Promise<void> {
  try {
    await sandbox.commands.run(`fuser -k ${E2B_DEV_PORT}/tcp; sleep 0.3`, {
      cwd: executer.E2B_APP_DIR,
    });
  } catch {
    // nothing was listening on the port
  }
  await sandbox.commands.run("npm run dev", {
    cwd: executer.E2B_APP_DIR,
    background: true,
  });
}

async function destroySandbox(sessionId: string): Promise<void> {
  const existing = await persistence.agentSessions.findUnique({
    where: { id: sessionId },
    select: { sandboxId: true },
  });
  if (!existing || existing.sandboxId === null) return;

  try {
    await Sandbox.kill(existing.sandboxId);
  } catch (error) {
    telemetry.logger.error("sandbox", "failed to kill", {
      sandboxId: existing.sandboxId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Gets or creates the session's sandbox and, if it's a fresh one, replays
 * its recorded events onto it. Shared by the agent loop and the plain
 * sandbox-reopen / file-browsing routes — no LLM call happens here.
 *
 * DB writes: AgentSession, via getOrCreateSandbox (see its own comment).
 * eventLog.getEvents only reads ToolInvocation here, never writes.
 */
async function openSandbox(
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
    eventLog
      .getEvents(sessionId)
      .then(async (priorEvents) => {
        if (priorEvents.length === 0) return;
        await executer.replayEvents(sandbox, priorEvents);
      })
      .catch(async (error: unknown) => {
        telemetry.logger.error("sandbox", "replay failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        await destroySandbox(sessionId);
      });
  }

  const previewUrl = getPreviewUrl(sandbox);
  return { sandbox, previewUrl };
}

/**
 * Reopens a session's sandbox (creating + replaying it if the old one died)
 * and returns its preview URL plus that session's tool-invocation history.
 * No LLM call, no tool loop — just the sandbox.
 *
 * The frontend's code view needs a session's tool activity (to render the
 * chat-history activity rows, and to drive the preview pane's step list
 * while a sandbox is still booting) at the same time it needs the preview
 * URL — bundling both into this one response avoids the two firing as
 * separate round-trips that can visibly land at different times.
 *
 * This is also what the frontend's manual refresh button hits, so it
 * restarts the dev server every call — the same stale-preview problem
 * runAgent restarts for after a run (see its own comment) can show up here
 * too, and a manual refresh is exactly when the user is asking to force past
 * it, so the extra restart latency is expected rather than wasted.
 */
async function getSandboxUrl(
  sessionId: string,
  userId: string,
): Promise<{
  sessionId: string;
  previewUrl: string;
  toolInvocations: ToolInvocationSummary[];
}> {
  const { sandbox, previewUrl } = await openSandbox(sessionId, false, userId);

  restartDevServer(sandbox).catch((error: unknown) => {
    telemetry.logger.error("sandbox", "dev server restart failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const toolInvocations = await getToolInvocations(sessionId);
  return { sessionId, previewUrl, toolInvocations };
}

export interface ToolInvocationSummary {
  id: string;
  runId: string | null;
  toolName: string;
  arguments: unknown;
  status: "running" | "success" | "failed";
  createdAt: Date;
}

async function getToolInvocations(
  sessionId: string,
): Promise<ToolInvocationSummary[]> {
  const rows = await persistence.toolInvocations.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      runId: true,
      toolName: true,
      arguments: true,
      status: true,
      createdAt: true,
    },
  });
  return rows;
}

/**
 * The recursive file/folder listing behind the workspace's code view. Never
 * creates a sandbox for a session that doesn't exist — same reopen-only
 * semantics as getSandboxUrl.
 */
async function listSandboxFiles(
  sessionId: string,
  userId: string,
): Promise<FileTreeNode[]> {
  const { sandbox } = await openSandbox(sessionId, false, userId);
  return fileTree.buildFileTree(sandbox);
}

/** Reads one file's content for the code view. Reopen-only, same as above. */
async function readSandboxFile(
  sessionId: string,
  path: string,
  userId: string,
): Promise<string> {
  const { sandbox } = await openSandbox(sessionId, false, userId);
  const content = await sandbox.files.read(executer.resolvePath(path));
  return typeof content === "string" ? content : String(content);
}

/**
 * Writes one file's content from a manual edit in the code view — the user
 * correcting something the agent got wrong. Reopen-only, same as above:
 * this never creates a sandbox for a session that doesn't have one yet,
 * since there'd be nothing to edit.
 *
 * DB writes: ToolInvocation (source: "user") — recorded the same way an
 * agent-driven writeFile would be, with runId/llmCallId left null since no
 * agent run or LLM call backs this write. Required so eventLog.getEvents'
 * replay (see openSandbox above) picks the edit back up if the sandbox is
 * ever recreated — skipping this would make a saved manual fix silently
 * vanish on the next replay.
 */
async function writeSandboxFile(
  sessionId: string,
  path: string,
  content: string,
  userId: string,
): Promise<void> {
  const { sandbox } = await openSandbox(sessionId, false, userId);
  const startedAt = Date.now();

  try {
    await sandbox.files.write(executer.resolvePath(path), content);
    await persistence.toolInvocations.create({
      data: {
        sessionId,
        source: "user",
        toolName: "writeFile",
        arguments: { path, content } as never,
        output: `Wrote ${path}`,
        status: "success",
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    await persistence.toolInvocations.create({
      data: {
        sessionId,
        source: "user",
        toolName: "writeFile",
        arguments: { path, content } as never,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      },
    });
    throw error;
  }
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
async function downloadSandboxZip(
  sessionId: string,
  userId: string,
): Promise<Archiver> {
  const { sandbox } = await openSandbox(sessionId, false, userId);
  const tree = await fileTree.buildFileTree(sandbox);
  const filePaths = collectFilePaths(tree);

  const archive = new ZipArchive({ zlib: { level: 9 } });

  for (const path of filePaths) {
    const content = await sandbox.files.read(executer.resolvePath(path), {
      format: "bytes",
    });
    archive.append(Buffer.from(content), { name: path });
  }

  void archive.finalize();
  return archive;
}

export const manager = {
  getOrCreateSandbox,
  ensureSessionExists,
  getPreviewUrl,
  updateSession,
  restartDevServer,
  destroySandbox,
  openSandbox,
  getSandboxUrl,
  getToolInvocations,
  listSandboxFiles,
  readSandboxFile,
  writeSandboxFile,
  downloadSandboxZip,
};
