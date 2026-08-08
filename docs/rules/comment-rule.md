# Code Comments — Best Practices

## What This Covers

A quick reference for when, how, and why to comment code — with concrete good/bad examples for each case.

## Why This Matters

Comments are the main way future readers (including you, in six months) understand the _reasoning_ behind code — not just the mechanics. Good comments cut onboarding time, prevent accidental breakage of non-obvious logic, and stop the same "wait, why is this here?" question from being asked repeatedly. Bad or missing comments cost teams real time in code review, debugging, and onboarding.

## Core Principle

Comment the **why**, not the **what**. Code should already show _what_ it does — comments exist to capture reasoning, context, or tradeoffs that aren't visible in the code itself.

```javascript
// Bad — just restates the code
// increment i by 1
i++;

// Good — explains non-obvious reasoning
// Start at index 1, not 0 — index 0 is reserved for the header row
i++;
```

---

## When to Comment

### 1. Non-obvious business logic / edge cases

**What it does:** Flags orders older than 90 days for manual review instead of auto-processing.
**Why it needs a comment:** The condition alone doesn't explain _why_ 90 days is the cutoff — that context lives in a policy decision, not the code.

```javascript
// Refunds older than 90 days go through manual review instead of
// auto-processing, per finance policy change in Q2
if (daysSinceOrder > 90) {
  flagForManualReview(order);
}
```

### 2. Workarounds / hacks

**What it does:** Forces a reflow by reading `offsetHeight` before the transform is applied.
**Why it needs a comment:** The line looks pointless in isolation — it's a browser-specific fix, and without the comment someone will "clean it up" and reintroduce the bug.
Always explain _why_ and link supporting context (issue, ticket, doc).

```javascript
// HACK: forcing a reflow here to fix Safari not repainting after
// the transform. See: https://github.com/org/repo/issues/1234
element.offsetHeight;
```

### 3. Public APIs / shared functions

**What it does:** Merges a user's preferences object with a defaults object.
**Why it needs a comment:** The precedence rule (explicit `false` beats `undefined`) isn't obvious from the function body alone, and callers need to know it without reading the implementation.
Use doc-comment syntax (JSDoc, docstrings, etc.) so IDEs and tooling surface them.

```javascript
/**
 * Merges user preferences with defaults, giving precedence to
 * explicit `false` values over undefined (so users can disable
 * a default that's normally `true`).
 */
function mergePreferences(user, defaults) { ... }
```

### 4. Dense logic (regex, bitwise ops, algorithms)

**What it does:** Validates that a string is a well-formed email address.
**Why it needs a comment:** Regex is hard to parse at a glance, and the specific edge case being handled (consecutive dots) would otherwise look like an arbitrary detail.

```javascript
// Matches emails but rejects consecutive dots (RFC 5321 edge case)
const emailRegex = /^[^\s@]+(?<!\.\.)@[^\s@]+\.[^\s@]+$/;
```

### 5. Section banners — breaking up large files

**What it does:** Marks the boundary between unrelated groups of exports in a file with several of them.
**Why it needs a comment:** In files with many exported functions (most useful in `middleware/`, `routes/`, and similar), a banner lets a reader jump to the right section by scanning, without reading every function signature first.

```typescript
// ============================================
// Authentication Middleware
// ============================================
export function authMiddleware() { ... }

// ============================================
// Rate Limiting
// ============================================
export function rateLimitMiddleware() { ... }
```

Don't add banners to small files with one obvious section — they add noise, not navigation.

### 6. TODOs — with context and an owner/ticket

**What it does:** Marks a temporary fallback as something to be removed later.
**Why it needs a comment:** Without an owner and ticket reference, TODOs get ignored indefinitely — the comment turns a vague intention into something trackable.

```javascript
// TODO(piyush): Remove this fallback once all clients are on API v2 (JIRA-482)
```

---

## Tag Vocabulary

Use these consistently so they're `grep`-able (`grep -rn "TODO:" src/`) and IDE-recognized:

| Tag        | Use for                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `TODO:`    | Planned work, not yet done                                                                                                    |
| `FIXME:`   | Known bug or incorrect behavior that needs fixing                                                                             |
| `NOTE:`    | Non-obvious context a reader needs, not an action item                                                                        |
| `HACK:`    | Intentional workaround — should be revisited, explain why it exists                                                           |
| `WARNING:` | Something that will break if changed carelessly (wrong order, implicit dependency, a constraint that isn't enforced by types) |

```typescript
// FIXME: this silently swallows Prisma unique-constraint errors
// HACK: E2B sandbox doesn't expose a native cancel signal, so we poll
// WARNING: this must run before express.json() — better-auth needs the raw body
```

## Function-Level Doc Blocks

For anything genuinely non-obvious — caching, retries, rate limits, workarounds — a single doc comment often needs to carry more than one kind of context at once. Rather than stacking separate one-line comments, use labeled sections inside one doc block:

```typescript
/**
 * WHY:
 * We keep a local cache because NeonDB latency is high
 * for requests from India.
 *
 * CONTEXT:
 * Cache invalidation happens after organization updates.
 *
 * WARNING:
 * Do not increase TTL without checking stale-data impact.
 *
 * TODO:
 * Replace with distributed cache when scaling horizontally.
 */
export function getCachedOrgSettings(orgId: string) { ... }
```

Use only the sections a given function actually needs — most doc blocks need just one (a `WHY:` or a `WARNING:`), not all four. If the _what_ is obvious from the function name and signature, skip the comment entirely; reserve doc blocks for the _why_ — a decision, trade-off, or constraint that isn't visible in the code itself.

---

## When NOT to Comment

- **Don't restate the code.** If the comment just says in English what the next line already says in code, delete it.
- **Don't comment out dead code.** Delete it — git history preserves it. Commented-out blocks rot and leave readers unsure whether it's safe to remove.
- **Don't over-comment every line.** If you feel the urge to comment nearly every line, that's usually a sign the code needs better naming or decomposition instead.
- **Don't leave stale comments.** A comment that no longer matches the code is worse than no comment at all. If you touch code with a comment above it, update or remove the comment in the same change.

---

## Naming > Commenting

The best comment is often the one you don't need, because the code documents itself.

```javascript
// Instead of:
// check if user is eligible (over 18 and verified)
if (u.a >= 18 && u.v) { ... }

// Prefer:
const isEligibleForPurchase = user.age >= 18 && user.isVerified;
if (isEligibleForPurchase) { ... }
```

---

## Format Conventions

- Use your language's doc-comment standard consistently:
  - JSDoc for JavaScript/TypeScript
  - Docstrings for Python
  - `///` for Rust
  - Godoc-style for Go
- Keep a consistent tag vocabulary — see [Tag Vocabulary](#tag-vocabulary) above — many teams lint for these and track them in CI or issue trackers.
- Place comments on their own line above the code they describe. Avoid trailing same-line comments for anything non-trivial — they get cramped and are easy to miss.

---
