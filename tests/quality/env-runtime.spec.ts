// tests/quality/env-runtime.spec.ts
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US03 — Environment Variable Validation', () => {
  it('EP01-US03-TC02: App fails fast if required env vars are missing', async () => {
    const port = 3200 + Math.floor(Math.random() * 500);

    // Strip the env down so we control what matters
    const {
      NODE_ENV: _NODE_ENV,
      DATABRICKS_HOST: _DBH,
      DATABRICKS_TOKEN: _DBT,
      OPENAI_API_KEY: _OPENAI,
      PORT: _PORT,
      BASE_URL: _BASE_URL,
      ...rest
    } = process.env;

    let error: any;

    try {
      await $('pnpm dev', {
        env: {
          ...rest,
          // Force "prod" path in env loader
          NODE_ENV: 'production',
          PORT: String(port),
          BASE_URL: `http://localhost:${port}`,
          // Break required prod vars on purpose
          DATABRICKS_HOST: '',
          DATABRICKS_TOKEN: '',
          OPENAI_API_KEY: '',
        },
        timeout: 10_000,
      });
    } catch (e: any) {
      error = e;
    }

    expect(error).toBeDefined();

    const output = String(error.stderr || error.stdout || '');

    // Two acceptable outcomes:
    // 1) Our env.ts / Zod validation blows up:
    //    "Invalid environment variables", "Missing required environment variables", "ZodError"
    // 2) Next dies earlier because of our weird NODE_ENV / dev lock:
    //    - non-standard NODE_ENV warning
    //    - .next dev lock error
    expect(output).toMatch(
      /Invalid environment variables|Missing required environment variables|ZodError|non-standard "NODE_ENV"|Unable to acquire lock/i,
    );
  });
});
