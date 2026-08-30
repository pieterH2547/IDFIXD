#!/usr/bin/env node
/**
 * Every acceptance gate, in one pass.
 *
 *   npm run verify              everything, including the production build
 *   npm run verify -- --quick   everything except the build
 *
 * Plain Node with no dependencies, deliberately: this is the script that
 * reports the toolchain is broken, so it must not need the toolchain to
 * start. Every command is printed before it runs, and the summary names
 * each gate and its exit code — a gate result is evidence, a summary of one
 * is not.
 */

import { spawnSync } from "node:child_process";

const quick = process.argv.includes("--quick");

const GATES = [
  { name: "lint", command: "npm", args: ["run", "lint"] },
  { name: "typecheck", command: "npm", args: ["run", "typecheck"] },
  { name: "tests", command: "npm", args: ["test"] },
  {
    name: "build",
    command: "npm",
    args: ["run", "build"],
    skippedByQuick: true,
  },
];

const results = [];

for (const gate of GATES) {
  if (quick && gate.skippedByQuick) {
    results.push({ name: gate.name, status: "SKIPPED (--quick)" });
    continue;
  }

  console.log(`\n──── ${gate.name} ────`);
  console.log(`$ ${gate.command} ${gate.args.join(" ")}\n`);

  const run = spawnSync(gate.command, gate.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  results.push({
    name: gate.name,
    status: run.status === 0 ? "PASS" : `FAIL (exit ${run.status})`,
    failed: run.status !== 0,
  });
}

console.log("\n──── summary ────");
for (const result of results) {
  console.log(`  ${result.name.padEnd(12)} ${result.status}`);
}

const failed = results.filter((result) => result.failed);
if (failed.length > 0) {
  console.log(`\n${failed.length} gate(s) failed.\n`);
  process.exit(1);
}
console.log("\nAll gates passed.\n");
