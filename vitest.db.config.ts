// vitest.db.config.ts
import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/integration/**/*.spec.ts'],
    environment: 'node',
    testTimeout: 30000,
    env: {
      BASE_URL: 'http://localhost:3000',
      SESSION_SECRET: 'test_session_secret_at_least_32_chars_long!!',
    },
  },
});
