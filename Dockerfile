# ─────────────────────────────────────────────
# Stage 1: Install workspace dependencies
#
# Only the manifests are copied here (no source) - apps/web and
# packages/shared package.json files are required so pnpm's frozen-lockfile
# check matches the full workspace graph in pnpm-lock.yaml, even though
# apps/api imports neither at runtime.
#
# PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD must be set *before* `pnpm install` -
# otherwise playwright's own postinstall downloads its bundled Chromium
# during this step, before we ever get to the system-chromium install in
# the production stage below.
# ─────────────────────────────────────────────
FROM node:24-bookworm-slim AS deps

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile


# ─────────────────────────────────────────────
# Stage 2: Prune to a production-only install of the API
#
# apps/api's `prisma` CLI (and its schema-engine binary) is a
# devDependency - it is intentionally NOT part of this pruned tree. The API
# only talks to Postgres through @prisma/adapter-pg (no Rust engine needed
# at runtime); migrations are handled entirely by the separate migrator
# stage below, which uses the full (unpruned) install instead.
# ─────────────────────────────────────────────
FROM deps AS deploy

RUN pnpm --filter api deploy --prod --legacy /deploy/api


# ─────────────────────────────────────────────
# Stage 3: Build the NestJS application
# ─────────────────────────────────────────────
FROM deps AS builder

COPY apps/api ./apps/api

# `prisma generate` runs as part of `pnpm --filter api build` and needs a
# datasource URL to resolve prisma.config.ts's env('DATABASE_DIRECT_URL') -
# a real connection is never made at generate time, so a placeholder is
# sufficient here. verify-deps-before-run is disabled because pnpm's
# dependency-state check does not tolerate this Docker layer's copy order.
RUN pnpm config set verify-deps-before-run false && \
    DATABASE_DIRECT_URL="postgresql://build-placeholder:dummy@localhost:5432/dummy" \
    pnpm --filter api build


# ─────────────────────────────────────────────
# Stage 4: Migrator - runs `prisma migrate deploy` against the real
# DATABASE_DIRECT_URL at container start. Built from `builder` (not
# `deploy`) because it needs the devDependency `prisma` CLI plus the
# schema-engine binary that its allow-listed postinstall downloads.
# ─────────────────────────────────────────────
FROM builder AS migrator

WORKDIR /repo/apps/api

ENV NODE_ENV=production

ENTRYPOINT ["node_modules/.bin/prisma", "migrate", "deploy"]


# ─────────────────────────────────────────────
# Stage 5: Lean production image
#
# dist/ already contains the compiled Prisma client (src/generated/prisma
# is plain TypeScript under apps/api/src, so `nest build` compiles it into
# dist/generated/prisma alongside everything else) - prisma/schema.prisma,
# prisma.config.ts and the schema-engine binary are only needed by the
# migrator stage above and are deliberately not copied here.
# ─────────────────────────────────────────────
FROM node:24-bookworm-slim AS production

ENV NODE_ENV=production \
    PORT=3003 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Production-only node_modules and package.json from the pruned deploy stage
COPY --from=deploy /deploy/api/node_modules ./node_modules
COPY --from=deploy /deploy/api/package.json ./package.json

# Compiled application output (includes the compiled Prisma client)
COPY --from=builder /repo/apps/api/dist ./dist

# System Chromium for the crawler's Playwright service, plus whatever
# shared libraries playwright-core's own dependency registry says this
# platform needs to run it - it detects Debian 12 ("debian12"/"debian12-arm64")
# and asks apt for the exact matching package list itself, rather than a
# hand-typed one that would drift from what Playwright actually expects.
RUN apt-get update && \
    apt-get install -y --no-install-recommends chromium ca-certificates && \
    node_modules/.bin/playwright install-deps chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 3003

CMD ["node", "dist/main.js"]
