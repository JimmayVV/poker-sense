import { defineConfig } from "@playwright/test";
import baseConfig from "./config/playwright.config";

// Override testDir to be relative to root
export default defineConfig({
  ...baseConfig,
  testDir: "./tests/e2e",
});
