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

## Deployment

Both services deploy to [Render](https://render.com) via `render.yaml` at the
repo root (`validex-api` and `validex-web`).

1. Deploy to Render via `render.yaml`. Set all env vars listed there in the
   Render dashboard for each service.
2. Ensure `ALGO_*_WALLET_ADDRESS` is opted into USDC on the selected network.
3. Run `prisma migrate deploy` against the production Neon DB.
4. Hit `GET /v1/health` to confirm the service is live.
5. Make one test payment on testnet to confirm the x402 flow works end-to-end.
6. Switch `NETWORK=mainnet` and redeploy.
7. Make one real mainnet USDC payment to confirm settlement and check the
   GoPlausible dashboard at https://facilitator.goplausible.xyz.
8. Verify the endpoint appears in Bazaar with the `x402-global-challenge` tag.

## Commits

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
