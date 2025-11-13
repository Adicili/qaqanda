// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import next from 'eslint-config-next';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  ...next,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'import/order': ['warn', { 'newlines-between': 'always' }],
    },
  },

  eslintConfigPrettier,

  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
]);
