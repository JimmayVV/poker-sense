import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./config/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "build/**",
        ".react-router/**",
        "**/*.config.*",
        "**/types/**",
        "**/*.d.ts",
        "tests/**",
      ],
      all: true,
      lines: 95,
      functions: 95,
      branches: 95,
      statements: 95,
    },
    include: ["app/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "build", ".react-router", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "../app"),
    },
  },
});
