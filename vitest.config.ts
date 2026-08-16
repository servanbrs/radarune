import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./scripts/server-only-empty.cjs"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    // Finance repository tests can legitimately wait for the shared DB mock
    // setup when the suite runs in parallel on constrained local machines.
    testTimeout: 15_000,
    include: ["src/**/*.test.ts"],
  },
});
