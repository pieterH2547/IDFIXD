import { defineConfig } from "prisma/config";
import "dotenv/config";

/**
 * Prisma 7 moved the connection URL out of `schema.prisma`. Only the CLI
 * (`db push`, `studio`, `migrate`) reads this file — the application gets
 * its connection from the libSQL adapter in `src/lib/db.ts`.
 *
 * `DATABASE_URL` therefore describes the *local development* database and
 * nothing else. Production runs on Turso and is configured by
 * `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`, which the CLI never needs.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
  migrations: {
    seed: "tsx scripts/seed.ts",
  },
});
