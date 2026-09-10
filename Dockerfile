# ─────────────────────────────────────────────
# Stage 1: Install ALL workspace dependencies
# and prune down to only what the API needs.
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps

# Pin to the exact pnpm version from packageManager field in package.json.
# @latest would risk grabbing a different version that breaks the frozen lockfile.
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

WORKDIR /repo

# Copy ALL workspace manifests so pnpm can resolve the full graph.
# packages/shared must be present even if the API doesn't directly depend on it –
# pnpm needs every workspace member's package.json to build the resolution graph.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Copy Prisma schema now so it's available if any lifecycle script needs it.
COPY apps/api/prisma ./apps/api/prisma

# Install with --ignore-scripts so the postinstall `prisma generate` hook
# doesn't fire here (no src/generated output dir exists yet; that happens in
# the builder stage where full source is present).
RUN pnpm install --frozen-lockfile --ignore-scripts

# Produce a self-contained deployment directory for the API only.
# --ignore-scripts prevents postinstall from running again inside /deploy/api
# where the prisma schema context would be wrong.
RUN pnpm --filter api deploy --prod --ignore-scripts /deploy/api


# ─────────────────────────────────────────────
# Stage 2: Build the NestJS application
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

WORKDIR /repo

# Reuse the full install from the deps stage (needed for nest-cli, ts-node, etc.)
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api ./apps/api

# Generate Prisma client then compile TypeScript
RUN pnpm --filter api exec prisma generate && \
    pnpm --filter api build


# ─────────────────────────────────────────────
# Stage 3: Lean production image
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner

# Install Playwright OS-level dependencies + chromium for the scraper validators
# (remove this block if you don't use Playwright in prod)
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Tell Playwright to use the system chromium instead of downloading its own
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENV NODE_ENV=production

WORKDIR /app

# Production-only node_modules from the prune stage
COPY --from=deps /deploy/api/node_modules ./node_modules
COPY --from=deps /deploy/api/package.json ./package.json

# Compiled output
COPY --from=builder /repo/apps/api/dist ./dist

# Prisma schema & migrations folder (needed at runtime for `prisma migrate deploy`)
COPY --from=builder /repo/apps/api/prisma ./prisma

# Prisma config – Prisma 7 reads DATABASE_DIRECT_URL from this file for migrations.
# The schema.prisma datasource block has no `url` field, so without this file
# `prisma migrate deploy` would have no connection string and would fail.
COPY --from=builder /repo/apps/api/prisma.config.ts ./prisma.config.ts

# Generated Prisma client (output path matches schema: ../src/generated/prisma)
COPY --from=builder /repo/apps/api/src/generated ./src/generated

# Copy the prisma CLI binary from the builder so we can run `prisma migrate deploy`
# at startup without hitting the network. `prisma` is a devDependency so it is
# NOT included in the --prod node_modules from the deploy stage.
# @prisma/engines must also come along – it contains the migration engine binary
# that `prisma migrate deploy` invokes. Without it the command crashes at startup
# with "engine binary not found" even if the prisma CLI itself is present.
COPY --from=builder /repo/apps/api/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /repo/apps/api/node_modules/prisma ./node_modules/prisma
COPY --from=builder /repo/apps/api/node_modules/@prisma/engines ./node_modules/@prisma/engines

# Expose the API port (Render injects $PORT; default matches .env.example)
EXPOSE 5000

# Run Prisma migrations then start the server.
# Use the local prisma binary directly instead of npx to avoid a network round-trip.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
