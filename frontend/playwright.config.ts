import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  reporter: process.env.CI ? "github" : "list",
  testDir: "e2e",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: [
      "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3100/api/v1",
      "NEXT_PUBLIC_SITE_URL=https://www.properrent.co.uk",
      "NEXT_PUBLIC_SUPABASE_URL=https://proper-rent-test.supabase.co",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key",
      `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    ].join(" "),
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
});
