import { spawn, ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

import { expect } from 'vitest';

import { us, tc } from '../support/tags';

function buildCleanEnv(overrides: Record<string, string>): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = {
    NODE_ENV: 'development',
  };

  for (const [key, val] of Object.entries(process.env)) {
    if (typeof val === 'string') {
      base[key] = val;
    }
  }

  return { ...base, ...overrides };
}

async function waitForHttpOk(
  url: string,
  proc: ChildProcess,
  timeoutMs = 40_000,
  intervalMs = 750,
) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    // ako je proces crkao u međuvremenu — nema smisla čekati dalje
    if (proc.exitCode !== null) {
      throw new Error(`Dev server exited early with code ${proc.exitCode}`);
    }

    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {
      // server još nije spreman
    }
    await delay(intervalMs);
  }

  throw new Error(`Server at ${url} did not respond with 2xx within ${timeoutMs}ms`);
}

function startDevServer(): { proc: ChildProcess; url: string } {
  const url = 'http://localhost:3000';

  const env = buildCleanEnv({
    NODE_ENV: 'development',
    // Next ionako default-uje na 3000, ovo je samo eksplicitno
    PORT: '3000',
    BASE_URL: url,
  });

  if (process.platform === 'win32') {
    const shell = process.env.COMSPEC || 'cmd.exe';
    const proc = spawn(shell, ['/d', '/s', '/c', 'pnpm dev'], {
      env,
      stdio: 'pipe',
    });
    return { proc, url };
  }

  const proc = spawn('bash', ['-lc', 'pnpm dev'], {
    env,
    stdio: 'pipe',
  });

  return { proc, url };
}

us('US01', 'Project Setup & Bootstrap', () => {
  /**
   * @testcase EP01-US01-TC03
   * @doc docs/testing/EP01_Test_Cases.md
   *
   * Covers:
   * - Project boots successfully via `pnpm dev`
   * - Next.js dev server responds on BASE_URL
   * - Detects breaking changes preventing app startup
   */
  tc(
    'EP01-US01-TC03',
    'Next.js app boots successfully on http://localhost:3000',
    async () => {
      const { proc, url } = startDevServer();

      let error: unknown | null = null;

      try {
        const res = await waitForHttpOk(url, proc);
        expect(res.status).toBe(200);

        const html = await res.text();
        expect(html).toMatch(/<html/i);
      } catch (e) {
        error = e;
      } finally {
        proc.kill();
      }

      if (error) throw error;
    },
    60_000,
  );
});
