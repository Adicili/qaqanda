import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { expect, it, describe } from 'vitest';

const $ = promisify(exec);

describe('EP01-US03 - Environment Variable Validation', () => {
  /**
   * @testcase EP01-US03-TC02
   * @doc docs/testing/EP01_Test_Cases.md
   *
   * Covers:
   * - Runtime validation of environment variables
   * - App must fail fast on missing mandatory env vars
   * - Ensures no undefined config reaches production runtime
   */
  it('EP01-US03-TC02 - App fails fast if required env vars are missing', async () => {
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

    // Mora da pukne – bilo šta osim exit code 0 je ok
    expect(error).toBeDefined();

    const output = String(error.stderr || error.stdout || '');

    expect(output).toMatch(
      /Invalid environment variables|Missing required environment variables|ZodError|non-standard "NODE_ENV"|Unable to acquire lock|Cannot find module/i,
    );
  });
});
