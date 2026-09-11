import 'dotenv/config';
import { defineConfig } from 'prisma/config';

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
    //
    // Resolved by hand (not prisma/config's `env()` helper) because this
    // config file is loaded - and this value evaluated - even for
    // `prisma generate`, which never connects to a database. `env()`
    // throws PrismaConfigEnvError as soon as the var is missing, which
    // would make `generate` fail in CI/build environments that never set
    // DATABASE_DIRECT_URL. Real `migrate deploy` runs still read the
    // actual env var at container start (see the migrator image).
    url: process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL || '',
  },
});
