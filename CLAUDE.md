# SMW — monorepo map and rules

Bun workspace + Turborepo. Root `package.json` defines `workspaces: ["apps/*", "packages/*"]`. Always run `bun install` from the repo root, never inside an individual app/package.

## Layout

```
apps/
  web/       Vite + React + TanStack Router — the frontend
  server/    Express — the backend
packages/
  db/        @package/db — schema, ORM clients, migrations (owned by nothing else)
  ui/        @package/ui — shared shadcn component library (Base UI, not Radix)
old/         Archived pre-migration app. Reference only — see rules below.
```

## `packages/db` (`@package/db`)

- **Single source of truth**: `zenstack/schema.zmodel`. Never hand-edit anything under `zenstack/generated/` — it's regenerated output (the generated `schema.prisma` even has a "DO NOT MODIFY" header).
- After changing `schema.zmodel`, run `bun run generate` in this package. That does two things in one step: `zen generate` (produces `schema.ts`/`schema-lite.ts`/`models.ts`/`input.ts` for the ORM/hooks) **and** `prisma generate` against the ZenStack-generated `schema.prisma` (produces the real `@prisma/client`).
- **Two separate database clients exist on purpose, both exported from here**:
  - `schema` / `schema-lite` (exports) — feeds `ZenStackClient` (`@zenstackhq/orm`), used by `apps/server` for the generic CRUD/hooks endpoint. `ZenStackClient` and `PrismaClient` are _not_ interchangeable — `ZenStackClient` implements `ClientContract` (`$schema`, `$options`, policy enforcement, procedures); a plain `PrismaClient` doesn't have this shape and will not work with `@zenstackhq/server`'s handlers.
  - `prisma` (export, `src/prisma.ts`) — a real generated Prisma client, used **only** by better-auth's `prismaAdapter` in `apps/server`. Nothing else should need it; app CRUD goes through `ZenStackClient`.
- `prisma/migrations/` and `prisma/seed.ts` are real and tracked — `bunx prisma migrate dev` / `bunx prisma db seed` run from this package (`prisma.config.ts` points at the generated schema path).
- `prisma/seed.ts` has its **own** minimal `betterAuth` instance (just `prismaAdapter` + `emailAndPassword`) purely to call `signUpEmail` correctly (proper password hashing + `Account` rows). It intentionally does not import `apps/server`'s full auth config (Google OAuth, email templates) — packages don't reach into apps.

## `apps/server`

- Express app. Two independent things are mounted side by side — don't conflate them:
  - `/api/model/*` — generic CRUD via `@zenstackhq/server`'s `ZenStackMiddleware` + `RPCApiHandler`, backed by `ZenStackClient` (`src/lib/zen.ts`). This is what the frontend's ZenStack hooks (`@zenstackhq/tanstack-query`) call.
  - `/api/v1/*` — hand-written routes (`feed`, `posts`, `users`, `notifications`) for business logic the generic endpoint can't express (transactional counters, follow-request states, notification fan-out). These have real `services/*` behind them and are **not** going away in favor of generic hooks — that's a deliberate split, not a migration-in-progress.
  - `/api/v1/auth/*` — better-auth, mounted with `toNodeHandler` **before** `express.json()` (better-auth needs the raw body).
- Runs on port **3001** (not 3000 — that's the archived `old/server`, kept distinct in case both need to run side by side during cleanup).
- **No `@@allow`/`@@deny` access policies exist yet in `packages/db`'s schema.** Both the custom routes (behind `AuthMiddleware`) and the generic `/api/model` endpoint are otherwise unauthenticated/unrestricted at the ORM level. Do not point this at real user data until policies are added.
- Test suite (`src/tests/`, `bun test`) hits a **live** running server over real HTTP against the seeded DB (not mocked) — start the dev server and make sure the DB is seeded (`bun run generate` + `bunx prisma db seed` in `packages/db`) before running tests.

## `apps/web`

- TanStack Router, file-based routes in `src/routes/`. Route files with a `-` prefix (e.g. `-app-sidebar.tsx`, `-hooks.tsx`) are non-route helper modules, not registered routes.
- **Never add shadcn/ui primitives locally.** `components.json` is configured so new components go to `packages/ui` (`ui`/`utils` aliases point at `@package/ui/components` / `@package/ui/lib/utils`). Only app-specific code (routes, forms in `components/custom/`, hooks, `lib/`, `utils/`) lives here.
- Talks to `apps/server` two ways: `utils/axios.ts` (→ `/api/v1/*` custom routes, used by the ported dashboard/feed code) and, where wired up, `@zenstackhq/tanstack-query` hooks (→ `/api/model/*`). `VITE_API_BASE_URL` in `.env` must point at `apps/server` (currently `http://localhost:3001`).
- The landing page (`routes/index.tsx`) is a **deliberate placeholder** — the real design is a separate, not-yet-done task. Don't treat its current content as final.
- **React performance/hooks rules live in `apps/web/CLAUDE.md`**, not here — memoization, effect vs. render-time state, data-fetching, and list-rendering conventions specific to this frontend.

## `packages/ui` (`@package/ui`)

- shadcn style **`base-vega`**, built on **`@base-ui/react`** — not Radix UI. This matters: Base UI components use a `render` prop for polymorphic rendering (e.g. `<SidebarMenuButton render={<Link .../>}>`), not Radix's `asChild`/`Slot` pattern. Don't assume Radix-flavored shadcn snippets from docs/StackOverflow/other projects drop in unchanged.
- Exports: `./components/*`, `./lib/*`, `./hooks/*`, `./globals.css`. `globals.css` is the single theme source (Tailwind + CSS variables) — apps import it once (`apps/web/src/main.tsx`) and don't redefine their own `:root` theme variables.

## `old/`

- Archived pre-monorepo app (original `client`/`server`), kept only as a reference while the port to `apps/*` finishes. **Not deployed, not developed further.**
- `old/client` has its own `CLAUDE.md` forbidding `mv`/`cp`/destructive terminal commands on it — porting work from here must be Read+Write, never move/copy shell commands, and never edit files in place here.
- Once the port is confirmed complete and nothing references it, `old/` is a deletion candidate — but that's a decision for the user to make explicitly, not something to do proactively.

## Cross-cutting conventions

- **Bun-first**: `bun install` / `bun run <script>` / `bun test`, not npm/yarn/pnpm equivalents.
- **Shared tooling devDependencies are hoisted to the root `package.json`**: `typescript`, `eslint` + its plugins, `@types/node`/`react`/`react-dom`, `@tailwindcss/vite`, `globals`. If two packages need the same _tooling_ dependency, add it at the root, not per-package. Actual runtime libraries (`react`, `zod`, `pg`, etc.) stay declared in whichever package imports them, even when versions happen to match across packages.
- Internal package references use the `workspace:*` protocol (e.g. `"@package/db": "workspace:*"`) — the dependency key must match the target's real `"name"` field, not its folder name.

## Engineering practices

- **Verify with the tool, not by eyeballing.** After any non-trivial change, run `bunx tsc --noEmit` in the affected package(s) and, for `apps/web`, `bun run build` (catches route-tree/codegen issues `tsc` alone won't). Don't declare something done on the strength of "it looks right."
- **Never hand-edit generated output.** `packages/db/zenstack/generated/`, `routeTree.gen.ts`, `dist/`, `.turbo/` — anything with a codegen header or produced by a build step gets regenerated, not patched. If generated output looks wrong, fix the source it's generated from.
- **No phantom dependencies.** If a file imports a package, that package is declared in _that package's_ `package.json` — don't rely on hoisting/transitive resolution to paper over a missing declaration (the root-hoisting rule above is only for shared _tooling_, not app code's runtime imports).
- **Security before shipping to real users.** Any endpoint backed by `ZenStackClient` needs `@@allow`/`@@deny` policies in `schema.zmodel` before it touches real data — an open generic CRUD endpoint is a development convenience, not a production posture. Same for secrets: `.env` files are gitignored repo-wide; never commit real credentials, and prefer documenting _which_ env vars a package needs (e.g. in its own `CLAUDE.md` or a `.env.example`) over assuming tribal knowledge.
- **Prefer integration tests over mocks for the data layer.** The existing `apps/server` suite hits a live server + seeded Postgres over real HTTP rather than mocking Prisma/ZenStack — keep that pattern for new tests in this app; a passing mock doesn't prove the ORM/migration/policy layer actually works.
- **Small, reversible changes.** Prefer additive migrations and new files over risky in-place rewrites; when porting or refactoring, keep the old code path available (as `old/` is) until the new one is verified, rather than deleting first and fixing forward.
- **Don't build ahead of what's asked.** No speculative abstractions, no extra config options "in case," no new packages/apps unless the task actually needs one — three similar call sites is fine without a shared helper.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
