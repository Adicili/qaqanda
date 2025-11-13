import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

function resolveLintTargets() {
  // Prefer App Router under src/, fallback to project root patterns
  const hasSrcApp = existsSync('src/app');
  const hasApp = existsSync('app');
  const dirs: string[] = [];

  if (hasSrcApp) {
    dirs.push('src/app', 'src/lib', 'src/schemas', 'tests');
  } else {
    if (hasApp) dirs.push('app');
    if (existsSync('lib')) dirs.push('lib');
    if (existsSync('schemas')) dirs.push('schemas');
    dirs.push('tests');
  }

  // As a last resort, lint everything but rely on ESLint ignores
  return dirs.length ? dirs : ['.'];
}

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('pnpm lint exits with code 0 on clean source', async () => {
    const targets = resolveLintTargets();
    const cmd = `pnpm eslint ${targets.join(' ')} --ext .ts,.tsx --no-cache`;
    const { stdout, stderr } = await $(cmd, { env: process.env });
    // If ESLint finds errors, exec throws. This assertion is just to prove ESLint ran.
    expect(stdout + stderr).toMatch(/eslint/i);
  });
});
