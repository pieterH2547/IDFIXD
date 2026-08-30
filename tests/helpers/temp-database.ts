import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";

/**
 * A throwaway SQLite database with the real schema applied.
 *
 * The schema comes from `prisma migrate diff`, which reads
 * `prisma/schema.prisma` and prints the SQL without touching any database.
 * Two things follow from doing it that way rather than running `prisma db
 * push` at a temp URL:
 *
 * - the test can never write to a real database, not even by
 *   misconfiguration, because no command here is capable of it;
 * - the SQL is derived from the schema on every run, so the fixture cannot
 *   drift from the model the way a committed `schema.sql` would.
 */
export type TempDatabase = {
  url: string;
  cleanup: () => void;
};

export async function createTempDatabase(): Promise<TempDatabase> {
  const root = mkdtempSync(join(tmpdir(), "directory-starter-"));
  const file = join(root, "test.db");
  const url = `file:${file}`;

  const sql = execFileSync(
    "npx",
    [
      "prisma",
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema",
      "prisma/schema.prisma",
      "--script",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );

  const client = createClient({ url });
  try {
    for (const statement of splitStatements(sql)) {
      await client.execute(statement);
    }
  } finally {
    client.close();
  }

  return {
    url,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

/** The generated script is plain DDL: comments, then semicolon-terminated
 *  statements, none of which contain a semicolon in a string literal. */
function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) =>
      statement
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((statement) => statement.length > 0);
}
