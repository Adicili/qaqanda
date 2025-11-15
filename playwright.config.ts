import { defineConfig, devices } from '@playwright/test';

import { ENV } from './lib/env';

const PORT = ENV.PORT ?? 3000;
const BASE_URL = ENV.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/ui',
  timeout: 30_000,
  fullyParallel: true,
  retries: ENV.CI ? 2 : 0,

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
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'development',
      BASE_URL: `http://localhost:${PORT}`,
    },
  },
});
