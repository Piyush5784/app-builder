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

function watchForCancellation(runId: string): RunWatcher {
  const controller = new AbortController();
  const interval = setInterval(() => {
    isCancelRequested(runId)
      .then((cancelled) => {
        if (cancelled) controller.abort();
      })
      .catch(() => {
        // ignore transient DB hiccup
      });
  }, POLL_INTERVAL_MS);

  return {
    signal: controller.signal,
    stop: () => clearInterval(interval),
  };
}

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
