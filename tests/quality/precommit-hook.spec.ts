import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const $ = promisify(exec);

const TMP_DIR = 'tmp-lint-violation';
const BAD_FILE = `${TMP_DIR}/bad.tsx`;

function safeGit(cmd: string) {
  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch {
    /* ignore */
  }
}

beforeEach(() => {
  // Ensure tmp folder exists fresh for each test
  mkdirSync(TMP_DIR, { recursive: true });
  // Safe local identity for CI / Windows runners
  safeGit(`git config user.email "qa@example.com"`);
  safeGit(`git config user.name "QA Bot"`);
});

afterEach(() => {
  // Hard cleanup ONLY for the temp dir so we don't nuke the repo
  safeGit(`git reset --hard -- ${TMP_DIR}`);
  safeGit(`git clean -fd ${TMP_DIR}`);
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('US02-TC03: Pre-commit hook blocks lint/format violations', () => {
  it('commit with violations MUST fail due to husky/lint-staged', async () => {
    writeFileSync(
      BAD_FILE,
      `import React from 'react';\nconsole.log('trash');\nexport default 1 as any;\n`,
      'utf8',
    );

    await $(`git add ${BAD_FILE}`);
    let failed = false;
    try {
      await $(`git commit -m "test: provoke lint fail"`, { env: { ...process.env, HUSKY: '1' } });
    } catch (e: any) {
      failed = true;
      const out = (e.stdout || '') + (e.stderr || '');
      expect(out).toMatch(/no-console|no-unused-vars|ESLint/i);
    }
    expect(failed).toBe(true);
  });

  it('after fixing issues, commit MUST succeed', async () => {
    // Recreate dir in case a previous test cleaned it
    mkdirSync(dirname(BAD_FILE), { recursive: true });
    writeFileSync(BAD_FILE, `export default function Ok(){ return null }\n`, 'utf8');
    await $(`git add ${BAD_FILE}`);
    const { stdout } = await $(`git commit -m "chore: fix lint"`, {
      env: { ...process.env, HUSKY: '1' },
    });
    expect(stdout).toMatch(/chore: fix lint/);
  });
});
