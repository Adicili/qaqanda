import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { describe, it, expect } from 'vitest';

const $ = promisify(exec);

describe('US02-TC02: Prettier configured and enforces formatting', () => {
  it('prettier --check . reports all files formatted', async () => {
    const { stdout } = await $(`pnpm prettier --check .`, { env: process.env });
    expect(stdout).toMatch(/All matched files use Prettier code style!/);
  });
});
