/* eslint-disable no-restricted-properties */
// playwright.config.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const isCI = process.env.CI === '1' || process.env.CI === 'true';

export default defineConfig({
  testDir: 'tests',
  globalSetup: './tests/support/global-setup.ts',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: isCI ? 2 : undefined,

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
      use: { baseURL: BASE_URL },
      retries: process.env.CI ? 1 : 0,
    },
  ],

  webServer: {
    command: `pnpm dev --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    cwd: process.cwd(),
  },
});
