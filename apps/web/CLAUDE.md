# React performance & hooks rules (`apps/web`)

React 19, no React Compiler plugin configured — manual memoization still matters here, nothing is automatic. These rules apply on top of the monorepo-wide conventions in the root `CLAUDE.md`.

## Rendering & memoization

- **Don't reach for `React.memo`/`useMemo`/`useCallback` by default.** They have their own comparison cost. Use them only where there's an actual measured or obvious cost: large lists, expensive computed values (filtering/sorting/transforming real data), or a callback passed to a `React.memo`-wrapped child (otherwise the new function reference defeats the memo anyway).
- `useMemo` on a value that's just a property access or trivial expression (`useMemo(() => user.name, [user])`) is pure overhead — return the expression directly.
- Prefer functional `setState` updates (`setCount(prev => prev + 1)`) over reading the current value from closure (`setCount(count + 1)`) whenever the update depends on the previous value — closures over stale state are a real, recurring bug class, not just a style preference.
- **Don't create derived state.** If a value can be computed from existing state/props (`fullName` from `firstName` + `lastName`), compute it inline during render — don't give it its own `useState` that can drift out of sync.
- Keep state as close to where it's used as possible. State lifted higher than it needs to be re-renders everything below it on every update.
- Memoize a Context provider's `value` object (`useMemo(() => ({ user, login }), [user])`) — an inline object literal is a new reference every render and re-renders every consumer regardless of whether the actual data changed.

## Effects — this is the one the codebase already got bitten by

- **`useEffect` is for synchronizing with an external system** (subscriptions, DOM APIs, sockets) — not for deriving state from props/data that already changed this render.
- If you're about to write `useEffect(() => { setSomething(...) }, [dep])` to seed/derive state once when `dep` becomes available, prefer the render-time pattern instead — see `useHistorySeed` in `src/routes/dashboard/build/-hooks.ts` for the actual precedent in this codebase: a guarded `if (!hasSeeded && dep) { setHasSeeded(true); setSomething(...) }` directly in the render body. React re-renders immediately with the update before committing, so there's no extra flush like an effect causes, and `eslint-plugin-react-hooks`'s `set-state-in-effect` rule won't flag it (rightly — that rule exists because this exact codebase hit it).
- `useRef` is for values that must persist across renders **without** triggering one (DOM node handles, previous-value tracking, timer ids) — never use it to gate a conditional `setState` call the way `historySeeded` used to; use real `useState` for that so the render-time-adjustment pattern above works correctly (mutating a ref during render is impure).

## Data fetching

- **TanStack Query is already the standard here** (`@zenstackhq/tanstack-query` hooks for `/api/model/*`, plain `useQuery`/`useMutation` for `/api/v1/*`) — never hand-roll `useEffect(() => { fetch(...) }, [])`. It's already buying caching, retries, background refresh, and dedup for free.
- One custom hook per query/mutation, grouped in that route's `-hooks.ts` (see `dashboard/build/-hooks.ts`) — keeps the route component itself down to composition + JSX, not fetch logic.
- Debounce expensive input-driven calls (search-as-you-type hitting an API) — don't fire a request per keystroke.

## Big lists / heavy renders

- Virtualize anything list-rendering hundreds+ items (`@tanstack/react-virtual` if it comes up — not pulled in yet, don't add it speculatively before an actual list needs it).
- `useTransition`/`useDeferredValue` for expensive renders driven by fast-changing input (search-filtering a large in-memory set) — keeps typing responsive while the heavy render lags slightly behind.
- `useId` for element ids that need to be stable and unique (label/input pairing, ARIA) — never `Math.random()` or a manually incremented counter, both break under SSR/hydration and StrictMode double-invoke.
- Route-level code splitting via `lazy()` + `Suspense` for genuinely heavy, rarely-hit routes — not a blanket rule for every route in a file-based router.
