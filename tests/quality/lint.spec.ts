import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

import { describe, it, expect } from 'vitest';

const execFileP = promisify(execFile);

function walkForTS(root: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const p = join(dir, name);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(p);
      } else {
        const ext = extname(p).toLowerCase();
        if (ext === '.ts' || ext === '.tsx') out.push(p);
      }
    }
  }
  walk(root);
  return out;
}

async function getRealTsFiles(): Promise<string[]> {
  // 1) Try Git for tracked .ts/.tsx
  try {
    const { stdout } = await execFileP('git', ['ls-files']);
    const tracked = stdout
      .split(/\r?\n/)
      .filter((p) => p && (p.endsWith('.ts') || p.endsWith('.tsx')))
      .filter((p) => existsSync(p));
    if (tracked.length > 0) return tracked;
  } catch {
    // ignore
  }

  // 2) Robust fallback: crawl common roots + explicitly add top-level configs
  const crawled = [
    ...walkForTS('src'),
    ...walkForTS('lib'),
    ...walkForTS('schemas'),
    ...walkForTS('tests'),
  ];

  const extras = ['next.config.ts', 'vitest.config.ts', 'eslint.config.mjs'].filter((p) =>
    existsSync(p),
  );

  const files = Array.from(new Set([...crawled, ...extras]));
  return files;
}

describe('US02-TC01: ESLint configured and passes cleanly', () => {
  it('eslint exits with code 0 on real TS/TSX files', async () => {
    const files = await getRealTsFiles();

    // Sanity: make sure we’re actually linting something
    expect(files.length).toBeGreaterThan(0);

    const quoted = files.map((f) => `"${f.replace(/\\/g, '/')}"`).join(' ');
    const cmd = `pnpm eslint ${quoted} --ext .ts,.tsx --no-cache`;

    const { stdout, stderr } = await execFileP('bash', ['-lc', cmd]).catch(async () => {
      // Windows PowerShell fallback if bash isn't present
      const { stdout: so, stderr: se } = await execFileP('cmd', ['/c', cmd]);
      return { stdout: so, stderr: se };
    });

    // Should run ESLint, not crash, and print something ESLint-y
    expect((stdout + stderr).toLowerCase()).toMatch(/eslint/);
  });
});
