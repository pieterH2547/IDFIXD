import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The integration test pushes a schema to a temp SQLite file, which is
    // slower than a unit test but still well inside a normal run.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
