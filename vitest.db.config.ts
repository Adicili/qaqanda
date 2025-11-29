// vitest.db.config.ts
import path from 'node:path';

import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

// Učitaj .env.local za DB testove
dotenv.config({ path: '.env.local' });

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/integration/**/*.spec.ts'],
    environment: 'node',
  },
});
