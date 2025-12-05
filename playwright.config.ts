/* eslint-disable no-restricted-properties */
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config({ path: '.env.local' });

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

// Only treat real CI (GitHub Actions) as CI
const isCI = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  testDir: 'tests',
  globalSetup: './tests/support/global-setup.ts',
  timeout: 30000,
  fullyParallel: true,
  retries: isCI ? 2 : 0,
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
      retries: isCI ? 1 : 0,
    },
  ],

  webServer: {
    command: isCI ? `pnpm next start --port ${PORT}` : `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    cwd: process.cwd(),
  },
});
