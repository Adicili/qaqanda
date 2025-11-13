import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const $ = promisify(exec);

const TMP = 'tmp-lint-violation';
const BAD_FILE = `${TMP}/bad.tsx`;

describe('US02-TC03: Pre-commit hook blocks lint/format violations', () => {
  beforeAll(() => {
    mkdirSync(TMP, { recursive: true });
    // Unused import + forbidden console.log (should trip your ESLint rules)
    writeFileSync(
      BAD_FILE,
      `import React from 'react';\nconsole.log('trash');\nexport default 1 as any;\n`,
      'utf8',
    );

    // Safe local git identity for CI
    try {
      execSync(`git config user.email "qa@example.com"`);
    } catch {}
    try {
      execSync(`git config user.name "QA Bot"`);
    } catch {}
  });

  afterAll(() => {
    try {
      execSync(`git reset --hard`);
    } catch {}
    rmSync(TMP, { recursive: true, force: true });
  });

  it('commit with violations MUST fail due to husky/lint-staged', async () => {
    await $(`git add ${BAD_FILE}`);
    let failed = false;
    try {
      // Do not pass --no-verify; we WANT the hook to run
      await $(`git commit -m "test: provoke lint fail"`, { env: { ...process.env, HUSKY: '1' } });
    } catch (e: any) {
      failed = true;
      const out = (e.stdout || '') + (e.stderr || '');
      // Sanity: show it really was ESLint that stopped the commit
      expect(out).toMatch(/no-console|no-unused-vars|ESLint/i);
    }
    expect(failed).toBe(true);
  });

  it('after fixing issues, commit MUST succeed', async () => {
    writeFileSync(BAD_FILE, `export default function Ok(){ return null }\n`, 'utf8');
    await $(`git add ${BAD_FILE}`);
    // Should succeed now
    const { stdout } = await $(`git commit -m "chore: fix lint"`, {
      env: { ...process.env, HUSKY: '1' },
    });
    expect(stdout).toMatch(/chore: fix lint/);
  });
});
