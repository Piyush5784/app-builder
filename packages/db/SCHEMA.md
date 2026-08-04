# Database schema reference

Source of truth: `zenstack/schema.zmodel`. This file is generated documentation — if the schema changes, regenerate this by hand or ask for an update; don't edit `schema.zmodel` from this file.

## Overview

| Table               | Purpose                                                                | Who can read it via `/api/model`           |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| `User`              | Account record (better-auth) + app profile fields                      | n/a (no policy set here; managed via auth) |
| `Session`           | better-auth login session (cookie-backed)                              | n/a                                        |
| `Account`           | better-auth linked login method (password/OAuth)                       | n/a                                        |
| `Verification`      | better-auth email/token verification codes                             | n/a                                        |
| `AgentSession`      | One "build" — a chat + its sandbox                                     | Owner only                                 |
| `Message`           | One row per message fed to the LLM (system/user/assistant/tool)        | Nobody — server-only                       |
| `AgentRun`          | One user prompt → one agent reply, within a session                    | Owner only (via session)                   |
| `LLMCall`           | One raw request/response to the LLM provider, within a run             | Nobody — server-only                       |
| `ToolInvocation`    | One tool call's result (writeFile, runCommand, etc.)                   | Owner only (via session)                   |
| `AgentEvent`        | A run-level notice not tied to any specific tool (e.g. step-limit hit) | Nobody — server-only                       |
| `SandboxEvent`      | A successful, file-changing tool call, kept for sandbox replay         | Nobody — server-only                       |
| `ModelPricing`      | $/token rate for a provider+model, effective-dated                     | Nobody — server-only                       |
| `CreditTransaction` | A ledger entry against a user's credit balance                         | Nobody — server-only                       |

"Server-only" means the only way to read/write it is the server's own code using the plain `prisma` client — it's unreachable through the generic `/api/model` endpoint the frontend calls, regardless of who's logged in.

---

## `User`

Better-auth's user table, extended with this app's own profile fields.

| Field                                              | Type                | What it stores / why                                                                                  |
| -------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                                               | `String` (uuid)     | Primary key, referenced by everything the user owns                                                   |
| `name`                                             | `String`            | Display name                                                                                          |
| `email`                                            | `String?`           | Login email — optional because some auth methods (e.g. future OAuth-only) might not always require it |
| `emailVerified`                                    | `Boolean`           | Whether the email has been confirmed (better-auth flow)                                               |
| `image`                                            | `String?`           | Avatar URL                                                                                            |
| `createdAt` / `updatedAt`                          | `DateTime`          | Standard bookkeeping                                                                                  |
| `username`                                         | `String?` `@unique` | Optional handle, separate from email                                                                  |
| `bio`                                              | `String?`           | Profile bio text                                                                                      |
| `isPrivate`                                        | `Boolean`           | Profile visibility flag (ported from the social-app half of this codebase)                            |
| `followersCount` / `followingCount` / `postsCount` | `Int`               | Denormalized counters, avoids counting rows on every profile view                                     |
| `credits`                                          | `Decimal`           | Current credit balance — the running total that `CreditTransaction` rows should sum to                |

---

## `Session`, `Account`, `Verification`

Standard better-auth tables — not app-specific, don't hand-edit their shape without checking better-auth's own migration expectations.

| Table          | Key fields                              | What they're for                                                                                     |
| -------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Session`      | `token` (unique), `expiresAt`, `userId` | The cookie-backed login session. `AuthMiddleware` resolves this on every request.                    |
| `Account`      | `providerId`, `accountId`, `password`   | One linked login method per row (email+password today; OAuth providers would each get their own row) |
| `Verification` | `identifier`, `value`, `expiresAt`      | Short-lived codes/tokens for email verification, password reset, magic links                         |

---

## `AgentSession`

One "build" — a chat thread plus the sandbox it's building in.

| Field          | Type                    | What it stores / why                                                                                                                                  |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `String` (uuid)         | Also used as the E2B sandbox's logical key and the URL param (`/dashboard/build/$sessionId`)                                                          |
| `name`         | `String?`               | Shown in the sidebar. Set from the first prompt (truncated to 100 chars), or a manual rename                                                          |
| `sandboxId`    | `String`                | The live E2B sandbox's real ID — used to `Sandbox.connect()` back to it, since the sandbox handle itself can't be cached across requests/instances    |
| `userId`       | `String`                | Owner — required, `onDelete: Cascade` (deleting a user deletes their sessions). Every read policy in this schema ultimately traces back to this field |
| `createdAt`    | `DateTime`              | When the session was created                                                                                                                          |
| `lastActiveAt` | `DateTime` `@updatedAt` | Bumped on every touch — the basis for a future "clean up idle sessions" sweep                                                                         |

---

## `Message`

One row per message in the exact sequence fed to the LLM. Replaces what used to be an in-memory `Map` — moving it here means a server restart (or running a second server instance) doesn't silently wipe the model's memory of the conversation.

| Field        | Type                                                    | What it stores / why                                                                                                                                                              |
| ------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `String` (uuid)                                         | Row identity                                                                                                                                                                      |
| `sessionId`  | `String`                                                | Which conversation this message belongs to                                                                                                                                        |
| `seq`        | `Int`                                                   | Explicit ordering. **Not** `createdAt` — a bulk insert can give several rows the same timestamp, so `seq` is what actually guarantees stable order. Unique per `(sessionId, seq)` |
| `role`       | `MessageRole` enum (`SYSTEM`/`USER`/`ASSISTANT`/`TOOL`) | Who "said" this message, in LLM chat-format terms                                                                                                                                 |
| `content`    | `String?`                                               | The message text. Null for an assistant message that's purely a tool call with no accompanying text                                                                               |
| `toolCalls`  | `Json?`                                                 | Set on assistant messages that called tools — the raw `{id, name, arguments}[]` the model asked for                                                                               |
| `toolCallId` | `String?`                                               | Set on a `TOOL`-role message — which tool call this is the result of                                                                                                              |
| `name`       | `String?`                                               | Set on a `TOOL`-role message — which tool ran                                                                                                                                     |
| `createdAt`  | `DateTime`                                              | Insert time (informational only — ordering relies on `seq`)                                                                                                                       |

Written append-only: each run reads the existing rows once, and on save only inserts whatever's new since then — never rewrites old rows.

---

## `AgentRun`

One user prompt → one agent reply. A session accumulates many of these over its lifetime.

| Field                      | Type                                         | What it stores / why                                                                                                                                                                                                                                                                 |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                       | `String` (uuid)                              | Row identity, referenced by `LLMCall`/`ToolInvocation`/`AgentEvent`/`CreditTransaction`                                                                                                                                                                                              |
| `sessionId`                | `String`                                     | Which session this run belongs to                                                                                                                                                                                                                                                    |
| `provider`                 | `String?`                                    | Which LLM provider handled it (`openrouter`/`gemini`/`ollama`)                                                                                                                                                                                                                       |
| `prompt`                   | `String`                                     | The user's message for this turn                                                                                                                                                                                                                                                     |
| `reply`                    | `String?`                                    | The assistant's final text reply, once done                                                                                                                                                                                                                                          |
| `status`                   | `Status` enum (`running`/`success`/`failed`) | Current state — `running` until the loop finishes or errors                                                                                                                                                                                                                          |
| `errorMessage`             | `String?`                                    | Set on failure (including "Cancelled by user" — a cancellation is recorded as a failure, not its own status)                                                                                                                                                                         |
| `cancelRequested`          | `Boolean`                                    | Cross-instance cancel signal. The in-memory `AbortController` (same process only) is the fast path; this flag is what a _different_ server instance's still-running loop polls, so a cancel request lands even if it's handled by a different instance than the one running the loop |
| `totalCost`                | `Decimal?`                                   | Summed cost across this run's `LLMCall`s (not yet wired up to compute automatically)                                                                                                                                                                                                 |
| `startedAt` / `finishedAt` | `DateTime`                                   | Run duration                                                                                                                                                                                                                                                                         |

---

## `LLMCall`

One raw request/response to the LLM provider. A single run can span several of these — one per step in the tool-call loop.

| Field                    | Type            | What it stores / why                                                                                          |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`                     | `String` (uuid) | Row identity                                                                                                  |
| `runId`                  | `String`        | Which run this call was part of                                                                               |
| `provider` / `model`     | `String`        | Which provider+model actually served this specific call                                                       |
| `step`                   | `Int`           | Position within the run's loop (1, 2, 3…)                                                                     |
| `prompt`                 | `Json`          | The exact message array sent to the model for this call — a snapshot, independent of what `Message` holds now |
| `response`               | `Json?`         | The raw response: content + any tool calls requested                                                          |
| `tokensIn` / `tokensOut` | `Int?`          | Usage, when the provider reports it — optional because not every provider always does                         |
| `success`                | `Boolean`       | Whether the call completed without error                                                                      |
| `errorMessage`           | `String?`       | Set on failure                                                                                                |
| `latencyMs`              | `Int`           | How long the call took                                                                                        |
| `pricingId`              | `String`        | Which `ModelPricing` row priced this call                                                                     |
| `cost`                   | `Decimal?`      | Computed $ cost for this call                                                                                 |
| `createdAt`              | `DateTime`      | When the call happened                                                                                        |

Server-only — this is an audit/cost log, not something the UI reads directly (the UI gets its activity trace from `ToolInvocation` instead).

---

## `ToolInvocation`

One tool call's result — `writeFile`, `readFile`, `runCommand`, all of them, success or failure. This is what the chat UI's activity list is built from.

| Field          | Type            | What it stores / why                                                                                                           |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `id`           | `String` (uuid) | Row identity                                                                                                                   |
| `sessionId`    | `String`        | Denormalized from `run.sessionId` — lets the frontend query "all activity for this session" without joining through `AgentRun` |
| `runId`        | `String`        | Which run this tool call happened during                                                                                       |
| `llmCallId`    | `String`        | Which specific LLM call requested this tool                                                                                    |
| `toolName`     | `String`        | e.g. `writeFile`, `runCommand`                                                                                                 |
| `arguments`    | `Json`          | The exact arguments the model passed                                                                                           |
| `output`       | `String?`       | What the tool returned (file content read, command output, etc.)                                                               |
| `status`       | `Status` enum   | `success` or `failed` for this specific call                                                                                   |
| `errorMessage` | `String?`       | Set on failure                                                                                                                 |
| `durationMs`   | `Int?`          | How long the tool took to run                                                                                                  |
| `createdAt`    | `DateTime`      | When it ran                                                                                                                    |

---

## `AgentEvent`

A run-level notice that isn't about any specific tool call — operational/debugging visibility into a run.

| Field       | Type                                       | What it stores / why                        |
| ----------- | ------------------------------------------ | ------------------------------------------- |
| `id`        | `String` (uuid)                            | Row identity                                |
| `runId`     | `String`                                   | Which run this notice is about              |
| `level`     | `LogLevel` enum (`info`/`warning`/`error`) | Severity                                    |
| `message`   | `String`                                   | e.g. "step limit reached without finishing" |
| `metadata`  | `Json?`                                    | Extra structured context for the message    |
| `createdAt` | `DateTime`                                 | When it happened                            |

---

## `SandboxEvent`

A successful, file-changing tool call — kept purely so a dead sandbox (E2B idle timeout, or the server itself restarting) can be rebuilt by replaying these in order.

| Field       | Type            | What it stores / why                                                                                                                   |
| ----------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | `String` (uuid) | Row identity                                                                                                                           |
| `sessionId` | `String`        | Which session's sandbox this rebuilds                                                                                                  |
| `toolCall`  | `Json`          | The minimal `{id, name, arguments}` needed to redo the call — no output, no status, no timing, because replay doesn't need any of that |
| `createdAt` | `DateTime`      | Replay order                                                                                                                           |

Only `writeFile`/`editFile`/`deleteFile`/`runCommand` calls that **succeeded** get a row here — a failed edit or any read-only call (`readFile`/`listFiles`) never changed the sandbox, so replaying it would do nothing useful.

---

## `ModelPricing`

$/token rate for a provider+model, effective-dated so historical costs stay accurate even after prices change.

| Field                                            | Type                     | What it stores / why                                        |
| ------------------------------------------------ | ------------------------ | ----------------------------------------------------------- |
| `id`                                             | `String` (uuid)          | Row identity                                                |
| `provider` / `model`                             | `String`                 | Which model this rate applies to                            |
| `inputPricePerMillion` / `outputPricePerMillion` | `Decimal`                | Cost per 1M tokens, in/out                                  |
| `effectiveFrom` / `effectiveTo`                  | `DateTime` / `DateTime?` | Validity window — `effectiveTo: null` means "still current" |
| `createdAt`                                      | `DateTime`               | Row creation time                                           |

---

## `CreditTransaction`

A ledger entry against a user's credit balance — every deduction or top-up gets a row, so `User.credits` is always reconstructable/auditable, not just a number that silently drifts.

| Field         | Type                                                                        | What it stores / why                                                                                      |
| ------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `id`          | `String` (uuid)                                                             | Row identity                                                                                              |
| `userId`      | `String`                                                                    | Whose balance this affects                                                                                |
| `runId`       | `String`                                                                    | Which run caused this charge (a `usage` transaction ties directly to the run that spent it)               |
| `amount`      | `Decimal`                                                                   | Signed amount — positive for top-ups/refunds, negative for usage (convention, not enforced by the schema) |
| `type`        | `CreditTransactionType` enum (`usage`/`topup`/`refund`/`system_adjustment`) | Why this entry exists                                                                                     |
| `description` | `String?`                                                                   | Human-readable note                                                                                       |
| `metadata`    | `Json?`                                                                     | Extra structured context                                                                                  |
| `createdAt`   | `DateTime`                                                                  | When it happened                                                                                          |

Not yet wired up to any actual code path — the table exists ahead of the billing feature described earlier in this conversation.

---

## Enums

| Enum                    | Values                                          | Used by                                    |
| ----------------------- | ----------------------------------------------- | ------------------------------------------ |
| `Status`                | `running`, `success`, `failed`                  | `AgentRun.status`, `ToolInvocation.status` |
| `CreditTransactionType` | `usage`, `topup`, `refund`, `system_adjustment` | `CreditTransaction.type`                   |
| `LogLevel`              | `info`, `warning`, `error`                      | `AgentEvent.level`                         |
| `MessageRole`           | `SYSTEM`, `USER`, `ASSISTANT`, `TOOL`           | `Message.role`                             |
