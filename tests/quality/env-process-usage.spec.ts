import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US03 — Environment Variable Validation', () => {
  it('EP01-US03-TC03: No direct process.env usage outside lib/env.ts', async () => {
    // Grep through all tracked files for process.env
    const { stdout } = await $(
      `git ls-files | grep -v node_modules | xargs grep -n "process\\.env\\." || true`,
    );

    // Filter out the allowed file
    const offending = stdout
      .split('\n')
      .filter(
        (line) =>
          line.trim() &&
          !line.includes('lib/env.ts') &&
          !line.includes('tests/quality/env-process-usage.spec.ts'),
      );

    // Assert that there are no forbidden usages
    if (offending.length > 0) {
      console.error('Found forbidden process.env usages:\n', offending.join('\n'));
    }
    expect(offending.length).toBe(0);
  });
});
