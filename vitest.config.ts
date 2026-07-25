import { defineConfig } from "vitest/config";
import path from "node:path";

try {
  process.loadEnvFile(path.resolve(__dirname, ".env.local"));
} catch {
  // .env.local is optional (e.g. CI supplies real env vars directly)
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    testTimeout: 30_000,
  },
});
