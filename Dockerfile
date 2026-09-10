# ─────────────────────────────────────────────
# Stage 1: Install ALL workspace dependencies
# and prune down to only what the API needs.
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps

# Enable corepack so pnpm is available without a separate install step
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /repo

# Copy manifests first – layer-cached until they change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# Install ALL dependencies (needed so pnpm deploy can resolve the graph)
RUN pnpm install --frozen-lockfile

# Produce a self-contained deployment directory for the API only
# This copies the resolved node_modules + package.json into /deploy/api
RUN pnpm --filter api deploy --prod /deploy/api


# ─────────────────────────────────────────────
# Stage 2: Build the NestJS application
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

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

# Prisma schema & migrations (needed at runtime for `prisma migrate deploy`)
COPY --from=builder /repo/apps/api/prisma ./prisma

# Generated Prisma client (output path matches schema: ../src/generated/prisma)
COPY --from=builder /repo/apps/api/src/generated ./src/generated

# Expose the API port (Render injects $PORT; default matches .env.example)
EXPOSE 5000

# Run Prisma migrations then start the server.
# Using sh -c so $PORT is evaluated at runtime.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
