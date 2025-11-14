// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  ...nextCoreWebVitals,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-duplicate-imports': 'error',
      'import/order': ['warn', { 'newlines-between': 'always' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Use ENV from lib/env instead of process.env.*',
        },
      ],
      overrides: [
        {
          files: ['lib/env.ts'],
          rules: {
            'no-restricted-properties': 'off',
          },
        },
      ],
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
      'tmp-lint-violation/**',
    ],
  },
]);
