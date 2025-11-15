import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    sequence: { concurrent: false },
    include: ['tests/quality/**/*.spec.ts'],
    exclude: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'tests/ui/**',
      'tests/pages/**',
    ],
  },
});
