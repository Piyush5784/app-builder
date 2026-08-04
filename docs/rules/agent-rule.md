# Agent System — Rules

## Why the folders are separate

- `core/` — orchestration: the loop, chat history, replay log, the
  persistence facade. Owns no I/O itself, just calls the folders below.
- `sandbox/` — E2B sandbox lifecycle (create/reuse/expire/kill). The only
  place `AgentSession` gets written.
- `tools/` — tool schemas + execution against a sandbox. Doesn't know about
  the model or the database.
- `providers/` — one file per LLM wire format. Doesn't know about tools,
  sandboxes, or the database.
- `persistence/` — one file per DB table. Doesn't know about sandboxes,
  providers, or the loop.
- `events.ts` — the socket.io broadcaster. Doesn't know about the database.

Each folder owns exactly one concern, so changing how the model is called
never touches how a tool executes, and changing what gets stored never
touches how the sandbox behaves.

## Core logic (`core/`)

1. `agent-runtime.ts` is the only file that orchestrates across folders — sandbox, tools, providers, and persistence are never cross-called from any other file.
2. `facade.ts` is the only export surface `core/` exposes outward — routes and everything outside `agent/` only ever see `runAgent` / `getSandboxUrl`.
3. Chat history (`context.ts`) and the replay log (`event-log.ts`) are in-memory, keyed by `sessionId` — never confuse them with the persisted `AgentRun` / `ToolInvocation` tables covering the same subject.
4. The loop's step count is always bounded by `MAX_AGENT_ITERATIONS` — no code path loops without that limit.
5. A step's `LLMCall` row is written right after that step's model call returns — never reconstructed after the fact from later state.
6. A persistence write and its matching socket emit happen in the same code path — never add one without the other.

## Rules that must never be broken

1. One file per table in `agent/persistence/` — never two tables in one file.
2. Persistence functions are named `createX` / `updateX` / `upsertX`, matching the table — never a domain verb like `startRun` or `touchSession`.
3. Persistence always uses the plain `prisma` client — never `zen`.
4. A folder's internal files are only reached through its `index.ts` barrel — never import a file inside another folder directly from outside it.
5. `index.ts` files contain re-exports only — no logic, no renaming, no side effects.
6. Raw model output becomes a `ToolCall` only through `toToolCall()` — never hand-constructed anywhere else.
7. One `provider.chat()` call = one loop step = one `LLMCall` row.
8. Tool calls within a step execute sequentially, in the order the model returned them — never in parallel.
9. Killing a sandbox never deletes or cascades into `AgentSession` / `AgentRun` / `LLMCall` / `ToolInvocation` history.
10. `AgentEvent` is only for what no other table already implies — never a duplicate of a `logger.*` call.
11. Every socket.io event is scoped to a room named after `sessionId` — never a global broadcast.
