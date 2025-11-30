import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['tests/integration/databricks.canary.spec.ts'],
    exclude: [],
    globals: true,
    environment: 'node',
    reporters: 'verbose',
    passWithNoTests: true,
    testTimeout: 60_000,
  },
});
