# Validex

Startup health and validation API, built for the Algorand Global x402 Challenge.

## Structure

```
validex/
├── apps/
│   ├── api/          NestJS + Fastify API
│   └── web/          Next.js app
├── packages/
│   └── shared/       Shared TypeScript types
```

## Requirements

- Node.js >= 20
- pnpm 11+
- PostgreSQL
- Redis

## Getting started

```bash
pnpm install
cp .env.example apps/api/.env   # fill in values
pnpm --filter api prisma:migrate
pnpm dev        # apps/api on PORT (default 3000)
pnpm dev:web    # apps/web on 3000 (Next.js default) - override with -p if running alongside api
```

## Commits

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
