# Agent persistence

Four tables in `@package/db` (`zenstack/schema.zmodel`) track a coding-agent
session end to end. All four are written to via the plain `prisma` client
(never `zen`) and carry `@@deny('all', true)`, so the generic `/api/model`
endpoint can never touch them — see `lib/zen.ts`'s `PolicyPlugin` registration.

## What gets written, in order

**First prompt for a brand-new `sessionId`:**

1. `agent_sessions` row created — `id = sessionId`, `sandboxId = <new E2B sandbox>`.
2. `agent_runs` row created — `sessionId`, `prompt`, `status = running`. This is "run #1."
3. Loop step 1: call the model → `llm_calls` row created (`runId`, `provider`, `model`, `step = 1`, `success`, `latencyMs`).
4. If that call returned tool calls, for **each one executed** → `agent_events` row created — `sessionId`, `llmCallId` (the `llm_calls` row from step 3), `toolName`, `arguments`, `status`.
5. Loop repeats steps 3-4 for step 2, step 3, ... until the model stops calling tools or the step limit hits.
6. Loop ends → the `agent_runs` row from step 2 is **updated**: `reply`, `status`, `finishedAt`.

**Second prompt, same session, sandbox still alive:**

- `agent_sessions` row isn't recreated — just its `lastActiveAt` bumps.
- A **new** `agent_runs` row is created ("run #2"). Steps 3-6 repeat under it.

**If the sandbox died and a new prompt comes in for that same `sessionId`:**

1. Fresh E2B sandbox created; the *existing* `agent_sessions` row's `sandboxId` is updated to point at it (same row, not a new one).
2. Fetch `agent_events` for that `sessionId`, `WHERE status = success AND tool_name IN (mutating set)`, ordered by `id` — replay each onto the fresh sandbox.
3. Only then does the new prompt actually start (new `agent_runs` row, loop begins).

Replay pulls events for the **whole session**, across every run it's ever had —
not just the most recent one. The sandbox's file state is the cumulative
result of every successful edit across the entire conversation.

## Entity relationships

```
agent_sessions ──1:N── agent_runs ──1:N── llm_calls
       │                                      │
       └──────────────1:N── agent_events ─────┘
                          (via llm_call_id)
```

`agent_events` links to `agent_sessions` directly (replay needs the whole
session's history) *and* to the specific `llm_calls` row that requested it
(so a bad edit can be traced back to exactly which model response caused it).

## Debugging: which table to check

| Symptom | Check | Query shape |
|---|---|---|
| Agent gave a wrong/weird final reply | `agent_runs` first, then drill down | `SELECT * FROM agent_runs WHERE id = $runId` |
| A specific tool call didn't do what was expected | `agent_events`, `status = 'failed'` | `SELECT * FROM agent_events WHERE session_id = $id AND status = 'failed' ORDER BY id` |
| Which model response caused a bad tool call | `agent_events` joined to `llm_calls` | `SELECT e.*, c.provider, c.model, c.step FROM agent_events e JOIN llm_calls c ON c.id = e.llm_call_id WHERE e.id = $eventId` |
| Model/provider seems flaky (retries, malformed tool calls, free-tier issues) | `llm_calls`, `success = false` | `SELECT * FROM llm_calls WHERE run_id = $runId AND success = false ORDER BY id` |
| Sandbox/preview URL seems lost or stale | `agent_sessions` | `SELECT sandbox_id, last_active_at FROM agent_sessions WHERE id = $sessionId` |
| Rebuilt sandbox is missing edits or has them in the wrong order | `agent_events`, the exact replay query | `SELECT * FROM agent_events WHERE session_id = $id AND status = 'success' AND tool_name IN ('writeFile','editFile','deleteFile','runCommand') ORDER BY id` |
| A run looks stuck / never finished | `agent_runs`, abandoned runs | `SELECT * FROM agent_runs WHERE status = 'running' AND started_at < now() - interval '10 minutes'` |

General rule: **`agent_runs` for "what did the agent do this turn," `llm_calls`
for "was the model reliable," `agent_events` for "what actually changed on
disk," `agent_sessions` for "is the sandbox still valid."**
