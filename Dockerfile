# ─────────────────────────────────────────────
# Stage 1: Install ALL workspace dependencies
# and prepare a self-contained production deploy of the API.
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps

# Pin to the exact pnpm version from packageManager field in package.json.
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

WORKDIR /repo

# Copy workspace manifests so pnpm can resolve the full workspace graph.
# apps/web/package.json and packages/shared/package.json are required so pnpm's
# frozen lockfile check matches the full workspace graph in pnpm-lock.yaml.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Copy Prisma schema so any lifecycle scripts have access to it
COPY apps/api/prisma ./apps/api/prisma

# Install dependencies with --ignore-scripts so the postinstall `prisma generate` hook
# doesn't fire prematurely (src/ does not exist in this stage).
RUN pnpm install --frozen-lockfile --ignore-scripts

# Produce a self-contained deployment directory for the API with production dependencies.
RUN pnpm --filter api deploy --prod --legacy --ignore-scripts /deploy/api

# Ensure the Prisma schema engine binary is downloaded for Alpine (musl), and link the
# Prisma CLI and engine into /deploy/api/node_modules so `prisma migrate deploy` can run
# in the final image without internet access or broken symlinks to /repo.
RUN cd /deploy/api && \
    ENGINES_PKG=$(ls -d node_modules/.pnpm/@prisma+engines@*/node_modules/@prisma/engines 2>/dev/null | head -n 1) && \
    if [ -n "$ENGINES_PKG" ]; then \
      node "$ENGINES_PKG/scripts/postinstall.js"; \
    fi && \
    cd /deploy/api/node_modules && \
    ln -sf .pnpm/prisma@*/node_modules/prisma prisma && \
    mkdir -p @prisma && \
    cd @prisma && \
    ln -sf ../.pnpm/@prisma+engines@*/node_modules/@prisma/engines engines && \
    cd ../.. && \
    mkdir -p node_modules/.bin && \
    ln -sf ../prisma/build/index.js node_modules/.bin/prisma && \
    chmod +x node_modules/.bin/prisma


# ─────────────────────────────────────────────
# Stage 2: Build the NestJS application
# ─────────────────────────────────────────────
FROM deps AS builder

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Generate Prisma client then compile TypeScript
RUN pnpm config set verify-deps-before-run false && \
    DATABASE_DIRECT_URL="postgresql://build-placeholder:dummy@localhost:5432/dummy" pnpm --filter api exec prisma generate && \
    pnpm --filter api build


# ─────────────────────────────────────────────
# Stage 3: Lean production image
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner

# Install Playwright OS-level dependencies + system chromium for scraper validators
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Configure Playwright to skip downloading its own browser and point to system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

ENV NODE_ENV=production

WORKDIR /app

# Production-only node_modules and package.json from the deploy stage
COPY --from=deps /deploy/api/node_modules ./node_modules
COPY --from=deps /deploy/api/package.json ./package.json

# Compiled application output
COPY --from=builder /repo/apps/api/dist ./dist

# Prisma generated client source artifacts
COPY --from=builder /repo/apps/api/src/generated ./src/generated

# Prisma schema & migrations folder (needed at runtime for `prisma migrate deploy`)
COPY --from=builder /repo/apps/api/prisma ./prisma

# Prisma config – Prisma 7 reads DATABASE_DIRECT_URL from this file for migrations.
COPY --from=builder /repo/apps/api/prisma.config.ts ./prisma.config.ts

# Startup entrypoint script
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Expose the API port (Render injects $PORT; application listens on process.env.PORT || 3000)
EXPOSE 5000

# Run Prisma migrations then start the server via entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
