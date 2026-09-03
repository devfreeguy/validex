import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma 7's config schema has no separate `directUrl` field - `url`
    // here is what Migrate/db push use, so it must be the direct (non-
    // pooled) Neon connection to bypass PgBouncer for DDL. Prisma Client
    // itself keeps using the pooled DATABASE_URL via the adapter
    // (see DatabaseService), independently of this file.
    url: env('DATABASE_DIRECT_URL'),
  },
});
