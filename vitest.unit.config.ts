// vitest.unit.config.ts
import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
    setupFiles: ['tests/unit/setup-db-mock.ts'],
    globals: true,
  },
});
