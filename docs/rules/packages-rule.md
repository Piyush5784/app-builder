# Packages — Rules

## Why this exists

`apps/web` and `apps/server` never talk to each other's internals directly —
they only meet through `packages/*` and HTTP. These rules keep that boundary
from eroding one "just this once" import at a time.

## Rules that must never be broken

1. `apps/web` never imports `@package/db`, directly or transitively — the browser has no business holding a connection string, a Prisma client, or a ZenStack client.
2. `apps/web` never talks to Postgres directly under any circumstances — every read/write goes through `apps/server`, no exceptions for "just this one query."
3. `apps/web` reaches the database in exactly two ways, both through the server: `@zenstackhq/tanstack-query` hooks → `/api/model/*` for generic, policy-protected CRUD, or `utils/axios.ts` → `/api/v1/*` for business logic the generic endpoint can't express. Never a third path.
4. If a model is plain CRUD and already policy-protected in `schema.zmodel`, use the generated ZenStack hook — don't hand-write an axios call and a custom route for something the generic endpoint already covers.
5. `apps/server` is the only consumer of `@package/db`'s clients (`prisma`, `zen`) — no other app or package imports them.
6. Inside `@package/db`, `prisma` (the plain client) is only for tables that must bypass ZenStack's policy layer (better-auth, and anything `@@deny('all', true)`) — everything else goes through `zen`.
7. `@package/ui` and `@package/shared` never import from `apps/*` — packages don't reach into apps, only apps reach into packages.
8. No copying code between packages or apps. If the same type, constant, or function is needed in two places, it lives in one package (`@package/shared` for cross-app types, `@package/ui` for components, `@package/db` for schema/ORM) and both sides import it.
9. A type used by both `apps/server` and `apps/web` belongs in `@package/shared` from the moment the second usage is written — not duplicated "for now."
