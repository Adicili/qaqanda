import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('pnpm lint exits with code 0 on clean source', async () => {
    // Limit the linting scope to real source directories
    // to avoid catching temp files from other tests
    const lintTargets = ['app', 'lib', 'schemas', 'tests'];
    const cmd = `pnpm eslint ${lintTargets.join(' ')} --ext .ts,.tsx --no-cache`;

    const { stdout, stderr } = await $(cmd, { env: process.env });

    // If ESLint errors occur, exec throws and the test fails automatically.
    // The below expectation just ensures that eslint ran properly.
    expect(stdout + stderr).toMatch(/eslint/i);
  });
});
