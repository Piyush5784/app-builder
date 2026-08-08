import { persistence } from "@/agent/persistence";

const POLL_INTERVAL_MS = 1000;

export interface RunWatcher {
  signal: AbortSignal;
  stop: () => void;
}

async function isCancelRequested(runId: string): Promise<boolean> {
  const run = await persistence.agentRuns.findUnique({
    where: { id: runId },
    select: { cancelRequested: true },
  });
  return run?.cancelRequested ?? false;
}

// Watches `AgentRun.cancelRequested` for this run and aborts the local
// controller as soon as another request sets it — no in-memory registry
// needed, the poll lives entirely on the run's own call stack and dies
// with it once `stop()` is called.
function watchForCancellation(runId: string): RunWatcher {
  const controller = new AbortController();
  const interval = setInterval(() => {
    isCancelRequested(runId)
      .then((cancelled) => {
        if (cancelled) controller.abort();
      })
      .catch(() => {
        // A transient DB hiccup here shouldn't abort an otherwise-healthy run.
      });
  }, POLL_INTERVAL_MS);

  return {
    signal: controller.signal,
    stop: () => clearInterval(interval),
  };
}

// Flags the session's active run for cancellation — true if one was found
// and flagged, false if there was nothing to cancel. The run's own watcher
// (above) picks this up within one poll interval and aborts itself; this
// function never touches the AbortController directly.
async function cancelRun(sessionId: string): Promise<boolean> {
  const run = await persistence.agentRuns.findFirst({
    where: { sessionId, status: "running" },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  if (!run) return false;
  await persistence.agentRuns.update({
    where: { id: run.id },
    data: { cancelRequested: true },
  });
  return true;
}

export const cancellation = { watchForCancellation, cancelRun };
