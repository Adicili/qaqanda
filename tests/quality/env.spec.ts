/**
 * EP01 — Project Foundation & Tooling
 * US03 — Environment Variable Validation
 *
 * Covers:
 *  - EP01-US03-TC01 — `.env.local.example` exists and includes placeholders
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect } from 'vitest';

import { us, tc } from '../support/tags';

us('US03', 'Environment Variable Validation', () => {
  tc('EP01-US03-TC01', '.env.local.example exists and includes placeholders', () => {
    const p = resolve(process.cwd(), '.env.local.example');
    expect(existsSync(p)).toBe(true);

    const txt = readFileSync(p, 'utf8');

    // Must include keys with an equals sign (placeholders allowed to be empty)
    const required = ['DATABRICKS_HOST', 'DATABRICKS_TOKEN', 'OPENAI_API_KEY'];
    for (const key of required) {
      const re = new RegExp(`^\\s*${key}\\s*=`, 'm');
      expect(re.test(txt)).toBe(true);
    }
  });
});
