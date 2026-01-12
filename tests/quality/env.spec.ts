import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, it, describe } from 'vitest';

describe('EP01-US03 - Environment Variable Validation', () => {
  /**
   * @testcase EP01-US03-TC01
   * @doc docs/testing/EP01_Test_Cases.md
   *
   * Covers:
   * - Existence of .env.local.example
   * - Presence of required environment variable placeholders
   * - Prevents missing baseline env contract
   */
  it('EP01-US03-TC01 - .env.local.example exists and includes placeholders', () => {
    const p = resolve(process.cwd(), '.env.local.example');
    expect(existsSync(p)).toBe(true);

    const txt = readFileSync(p, 'utf8');

    // Must include keys with an equals sign (placeholders allowed to be empty)
    const required = ['DATABRICKS_HOST', 'DATABRICKS_TOKEN', 'OPENROUTER_API_KEY'];
    for (const key of required) {
      const re = new RegExp(`^\\s*${key}\\s*=`, 'm');
      expect(re.test(txt)).toBe(true);
    }
  });
});
