FROM oven/bun:1 AS base

WORKDIR /app


# ─────────────────────────────────────────────
# 1. Prune monorepo
# ─────────────────────────────────────────────

FROM base AS pruner

RUN bun add -g turbo

COPY . .

RUN turbo prune server --docker


# ─────────────────────────────────────────────
# 2. Install dependencies
# ─────────────────────────────────────────────

FROM base AS installer

# Copy only dependency-related files first.
# This layer stays cached when source code changes.
COPY --from=pruner /app/out/json/ ./

RUN bun install --frozen-lockfile


# ─────────────────────────────────────────────
# 3. Build
# ─────────────────────────────────────────────

FROM base AS builder

# Reuse installed dependencies
COPY --from=installer /app/ ./

# Now copy the actual source code
COPY --from=pruner /app/out/full/ ./

# Generate generated files (e.g. Prisma)
RUN bun run generate

# Build only the server
RUN bunx turbo run build --filter=server


# ─────────────────────────────────────────────
# 4. Production
# ─────────────────────────────────────────────

FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/server/dist/index.js ./index.js

EXPOSE 3001

CMD ["bun", "index.js"]