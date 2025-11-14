// tests/quality/lint.spec.ts
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, it } from 'vitest';

const $ = promisify(exec);
const root = process.cwd();

function pickExisting(entries: string[]) {
  return entries
    .map((p) => path.resolve(root, p))
    .filter((abs) => existsSync(abs))
    .map((abs) => `"${abs.replace(/\\/g, '/')}"`); // make Windows paths CLI-safe
}

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('eslint exits with code 0 on real TS/TSX files', async () => {
    // Target real code & config — no git dependency
    const targets = pickExisting([
      'src/app',
      'lib',
      'schemas',
      'tests',
      'next.config.ts',
      'vitest.config.ts',
      'eslint.config.mjs',
    ]);

    // If nothing exists, that itself is a test smell — but still run eslint on cwd.
    const args = targets.length > 0 ? targets.join(' ') : '"."';

    const cmd = `pnpm eslint ${args} --ext .ts,.tsx --no-cache`;
    // If ESLint finds errors or misconfig, exec throws and the test fails. That’s what we want.
    await $(cmd, { env: process.env });
  });
});
