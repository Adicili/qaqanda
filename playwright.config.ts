/* eslint-disable no-restricted-properties */
// playwright.config.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

// Use isolated DB file for Playwright so local dev doesn't pollute tests
const PLAYWRIGHT_DB_PATH = '.qaqanda/local-db.playwright.json';
// Force Playwright runner + teardown to use the same DB path as the webServer
process.env.LOCAL_DB_PATH = PLAYWRIGHT_DB_PATH;
process.env.DB_MODE = 'local';

export default defineConfig({
  testDir: 'tests',
  globalSetup: './tests/support/global-setup.ts',
  globalTeardown: './tests/support/global-teardown.ts',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'ui',
      testDir: 'tests/ui',
      use: {
        browserName: 'chromium',
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL,
      },
    },
    {
      name: 'api',
      testDir: 'tests/api',
      workers: 1,
      use: {
        baseURL: BASE_URL,
      },
    },
  ],

  // Playwright starts the server. We inject LOCAL_DB_PATH so all routes share one file DB.
  webServer: {
    command: 'pnpm dev',
    port: PORT,
    reuseExistingServer: false,
    timeout: 120_000,
    cwd: process.cwd(),
    env: {
      ...process.env,

      // ✅ Force file DB for tests
      LOCAL_DB_PATH: PLAYWRIGHT_DB_PATH,

      // ✅ Disable Databricks in tests (no flake)
      USE_DATABRICKS_MOCK: 'false',
      DATABRICKS_HOST: '',
      DATABRICKS_TOKEN: '',
      DATABRICKS_WAREHOUSE_ID: '',
    },
  },
});
