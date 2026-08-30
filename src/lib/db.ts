import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * One database client, two deployments, no branching in application code.
 *
 * libSQL speaks both dialects we care about: `file:` URLs for local SQLite
 * and `libsql://` for Turso. So there is no "SQLite locally, something else
 * in production" split — it is the same driver either way, and the only
 * difference is the URL. That matters because a bug that only appears
 * against the production driver is the expensive kind.
 *
 * Prisma 7 requires a driver adapter, so this is also the only place the
 * connection is configured; `prisma.config.ts` is for the CLI alone.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function connectionUrl(): string {
  const turso = process.env.TURSO_DATABASE_URL;
  if (turso) return turso;

  const local = process.env.DATABASE_URL;
  if (local) return local;

  // A missing URL in production means every page would render an error.
  // Failing at startup makes that a deploy failure instead, which is the
  // cheaper place to find out.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No database configured. Set TURSO_DATABASE_URL (production) or DATABASE_URL (local).",
    );
  }
  return "file:./prisma/dev.db";
}

function createPrismaClient(): PrismaClient {
  const url = connectionUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = new PrismaLibSql(
    authToken ? { url, authToken } : { url },
  );

  return new PrismaClient({ adapter, errorFormat: "minimal" });
}

// Next's dev server re-evaluates modules on every edit; without this the
// connection count climbs until libSQL refuses new ones.
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
