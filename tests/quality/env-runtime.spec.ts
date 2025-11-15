// tests/quality/env-runtime.spec.ts
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US03 — Environment Variable Validation', () => {
  it('EP01-US03-TC02: App fails fast if required env vars are missing', async () => {
    let error: any;

    // Pick a non-3000 port to avoid collisions.
    const port = 3100 + Math.floor(Math.random() * 500);

    // Remove keys we’re going to override to avoid duplicate-property warnings.
    const {
      NODE_ENV: _NODE_ENV,
      DATABRICKS_HOST: _DB_HOST,
      DATABRICKS_TOKEN: _DB_TOKEN,
      OPENAI_API_KEY: _OPENAI,
      PORT: _PORT,
      BASE_URL: _BASE_URL,
      ...rest
    } = process.env as NodeJS.ProcessEnv;

    try {
      await $('pnpm dev', {
        env: {
          ...rest, // everything else passes through
          NODE_ENV: 'production', // override once (required for fail-fast)
          DATABRICKS_HOST: '', // intentionally broken/missing
          DATABRICKS_TOKEN: '', // intentionally broken/missing
          OPENAI_API_KEY: '', // optional, keep empty to be safe
          PORT: String(port), // free port so we don’t hit EADDRINUSE
          BASE_URL: `http://localhost:${port}`, // valid URL so Zod doesn’t choke on format
        },
        timeout: 10_000,
      });
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.stderr || error.stdout || '').toMatch(/invalid|missing|ZodError/i);
  });
});
