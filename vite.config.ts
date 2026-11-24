import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true,
    port: 5173,
    // Screenshot evidence is generated output, not source: watching it can
    // crash the dev server on Windows when files are copied/written in place.
    watch: { ignored: ["**/ui-review/**"] },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    testTimeout: 10_000,
    // Bound fork concurrency so each worker gets enough CPU to finish inside
    // testTimeout when other projects run suites on the same host. Reduced to
    // 2 after sustained host contention kept 4 workers above the 10s bound.
    maxWorkers: 2,
  },
});
