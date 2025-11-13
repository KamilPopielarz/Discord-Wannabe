import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 60,
        branches: 50,
      },
    },
    exclude: ["tests/e2e/**", "node_modules/**"],
    include: ["tests/unit/**/*.spec.ts", "tests/hooks/**/*.spec.ts", "tests/api/**/*.spec.ts"],
  },
});


