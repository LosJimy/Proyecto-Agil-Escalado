import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Testcontainers takes some time to pull the image
    testTimeout: 30_000,
    include: ["test/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    setupFiles: ["./test/vitest.setup.ts"],
    environment: "node",
  },
});
