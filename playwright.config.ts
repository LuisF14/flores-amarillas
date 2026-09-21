import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3000",
    browserName: process.env.TEST_BROWSER === "webkit" ? "webkit" : "chromium",
    channel: process.env.TEST_BROWSER === "webkit" ? undefined : "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
