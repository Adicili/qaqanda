import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    sequence: { concurrent: false }, // run files in series
  },
});
