import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 15000,
  retries: 0,
  use: {
    // Adjust to http://localhost:5173 if running Vite locally (without Docker)
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    headless: true,
    ignoreHTTPSErrors: true,
  },
  // No webServer block — tests assume the stack is already running (via Docker or manually)
});
