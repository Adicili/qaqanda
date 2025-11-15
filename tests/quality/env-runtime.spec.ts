import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US03 — Environment Variable Validation', () => {
  it('EP01-US03-TC02: App fails fast if required env vars are missing', async () => {
    const port = 3200 + Math.floor(Math.random() * 500);

    // Build a clean env without duplicate keys (and without real creds)
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
      // Force-load the env loader to trigger Zod immediately
      await $(`node -e "require('./lib/env')"`, {
        env: {
          ...rest,
          NODE_ENV: 'production', // trigger requireds
          DATABRICKS_HOST: '', // missing/invalid
          DATABRICKS_TOKEN: '', // missing/invalid
          OPENAI_API_KEY: '', // optional
          PORT: String(port),
          BASE_URL: `http://localhost:${port}`, // valid URL format
        },
        timeout: 8000,
      });
    } catch (e: any) {
      error = e;
    }

    expect(error).toBeDefined();
    // Match our explicit error text from lib/env.ts OR Zod wording
    const output = String(error.stderr || error.stdout || '');
    expect(output).toMatch(
      /Invalid environment variables|Missing required environment variables|ZodError/i,
    );
  });
});
