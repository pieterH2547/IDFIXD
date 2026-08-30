/**
 * `npm run seed` — reset the local database and load the demo dataset.
 *
 * This is deliberately not a separate hardcoded fixture. It runs the real
 * importer against the real `data/` files, so the demo data exercises the
 * same validation path a new directory's first import will. A fixture that
 * bypasses the importer can pass while the importer is broken.
 */

import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });

async function main() {
  console.log("Clearing existing rows…");

  // Order matters: join tables and children first, parents after.
  await prisma.listingCategory.deleteMany();
  await prisma.listingTag.deleteMany();
  await prisma.source.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.$disconnect();

  console.log("Running the importer against data/…\n");
  execFileSync("npx", ["tsx", "scripts/import.ts"], { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
