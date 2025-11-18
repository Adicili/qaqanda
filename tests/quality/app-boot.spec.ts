/**
 * EP01 — Project Foundation & Tooling
 * US01 — Project Setup & Bootstrap
 *
 * Covers:
 *  - EP01-US01-TC03 — Next.js app boots successfully on http://localhost:PORT
 */

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

import { expect } from 'vitest';

import { us, tc } from '../support/tags';

async function waitForHttpOk(url: string, timeoutMs = 40_000, intervalMs = 750) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {
      // server not ready yet, ignore
    }
    await delay(intervalMs);
  }

  throw new Error(`Server at ${url} did not respond with 2xx within ${timeoutMs}ms`);
}

us('US01', 'Project Setup & Bootstrap', () => {
  tc(
    'EP01-US01-TC03',
    'Next.js app boots successfully on http://localhost:PORT',
    async () => {
      const port = 3000 + Math.floor(Math.random() * 500);
      const url = `http://localhost:${port}`;

      const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

      const dev = spawn(pnpmCmd, ['dev'], {
        env: {
          ...process.env,
          NODE_ENV: 'development',
          PORT: String(port),
          BASE_URL: url,
        },
        stdio: 'pipe',
      });

      let error: unknown | null = null;

      try {
        // čekamo da dev server stvarno počne da sluša
        const res = await waitForHttpOk(url);
        expect(res.status).toBe(200);

        const html = await res.text();
        // Minimalna sanity provera – stranica se renderuje
        expect(html).toMatch(/<html/i);
      } catch (e) {
        error = e;
      } finally {
        dev.kill();
      }

      if (error) throw error;
    },
    60_000,
  );
});
