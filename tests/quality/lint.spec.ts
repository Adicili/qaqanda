import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

function existingTargets(): string[] {
  const candidates = ['src/app', 'src/lib', 'src/schemas', 'app', 'lib', 'schemas', 'tests'];
  return candidates.filter((p) => existsSync(p));
}

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('pnpm lint exits with code 0 on clean source', async () => {
    const targets = existingTargets();
    const cmd = `pnpm eslint ${targets.join(' ')} --ext .ts,.tsx --no-cache`;
    const { stdout, stderr } = await $(cmd, { env: process.env });
    expect(stdout + stderr).toMatch(/eslint/i);
  });
});
