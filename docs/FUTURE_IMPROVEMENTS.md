# Future improvements

Ideas captured for later — not scoped or committed to yet, just recorded so they aren't lost.

## 1. Automatic free-provider/model fallback on rate limit

When the active provider hits its rate limit (e.g. NVIDIA's 40 rpm cap, OpenRouter's free-tier throttling), automatically switch to another configured free provider/model instead of failing the run. Needs: a defined fallback order across `apps/server/src/agent/providers/*`, and detecting "rate limited" specifically (429/provider-specific error) vs. a real failure so we don't fall back on genuine errors.

## 2. Model-based routing

Before running the main agent loop, use a cheap/fast classification step to detect what kind of task the prompt is (simple copy edit vs. a full new page vs. a complex refactor) and route to whichever configured model/provider suits that task best — instead of always using one fixed provider for every request. Ties into #1 (routing choice should also account for what's currently rate-limited).

## 3. Multiple sandbox templates in the app builder

Currently only one E2B template exists (bare Vite + React + TS, see `old/e2b.Dockerfile`). Offer several purpose-built templates instead — e.g. the planned Tailwind + shadcn/ui template, plus others (Next.js, a dashboard-focused stack, plain HTML/CSS/JS) — so the generated app starts from a stack suited to what's being built, not one generic scaffold for everything.

## 4. LLM auto-selects the template

Given #3, let the LLM pick which template best fits the user's initial prompt (e.g. "a marketing landing page" → the Tailwind/shadcn template; "a simple static page" → the plain HTML/CSS/JS template) instead of the user manually choosing one every time.

## 5. Option to run a sandbox directly, without the agent

Allow spinning up and using a sandbox on its own — without necessarily going through the AI agent loop for every session. Exact shape (manual file editing in a bare sandbox? a "bring your own code" mode? plain sandbox access for testing?) still needs deciding.

## 6. GitHub login/logout via better-auth — ✅ done

`better-auth` has a built-in GitHub social provider — sign-in/sign-out is close to a config addition (`socialProviders.github` + a registered GitHub OAuth app's client id/secret), not a build-from-scratch integration. Login-only scope (`read:user user:email`) is enough for this and should stay separate from #7's repo-write access — asking for `repo` scope just to let someone sign in is the wrong shape and a real trust red flag for users.

Implemented in `apps/server/src/lib/auth.ts` (`socialProviders.github`) and the login/register forms (`apps/web/src/components/custom/{login,register}-form.tsx`). Logout needed no new code — better-auth's `signOut()` is provider-agnostic.

## 7. Connect GitHub + save generated code to a repo

Two distinct pieces, matching how Vercel/Lovable/bolt.new structure this:

- **"Connect GitHub" (repo access)** — a separate authorization step from login, requested only when the user actually wants to save code, not at sign-in. Best practice here is a **GitHub App**, not a classic OAuth App — a GitHub App requests narrow, resource-specific permissions (e.g. "Contents: read & write" on repos it's installed into) instead of OAuth's all-or-nothing `repo` scope, and it's installable/revocable per-repo or per-org from the GitHub side, not just from ours. Store the resulting token encrypted at rest; if using a GitHub App's user-to-server tokens, handle their expiry/refresh.
- **"Save to GitHub" action** — shown per build once connected:
  - Not connected yet → show "Connect GitHub", then continue into the save flow once authorized.
  - Already connected → "Save to GitHub" directly.
  - First save for a session: create a new repo via the GitHub API, named after the session/project.
  - Subsequent saves for the same session: push to the _same_ repo (commit + push) rather than creating a new one each time — needs the repo's identity tracked against the session once created.
  - For actually getting the code there: run real `git` commands (`init`, `add`, `commit`, `push`) inside the E2B sandbox itself using the stored token as the credential — the sandbox already has git and the full working tree, so this is simpler and more robust than re-uploading every file through GitHub's Contents API, and it's the approach these tools actually use in practice.

## 8. Model picker in the UI

Let the user pick which provider/model to generate with, instead of always using the server's configured default (`PROVIDER` env var). The plumbing already exists — `/prompt` already accepts an optional `provider` field (see `agent.routes.ts`) — this is mainly a frontend dropdown (compose bar or a settings-style menu) wired to that existing param, plus deciding which of the configured providers/models are worth exposing to end users at all.
