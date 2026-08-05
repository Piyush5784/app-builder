import { setCancelRequested, isCancelRequested } from "@/agent/persistence";

const POLL_INTERVAL_MS = 1000;

export interface RunWatcher {
  signal: AbortSignal;
  stop: () => void;
}

// Watches `AgentRun.cancelRequested` for this run and aborts the local
// controller as soon as another request sets it — no in-memory registry
// needed, the poll lives entirely on the run's own call stack and dies
// with it once `stop()` is called.
export function watchForCancellation(runId: string): RunWatcher {
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
export async function cancelRun(sessionId: string): Promise<boolean> {
  return setCancelRequested(sessionId);
}
