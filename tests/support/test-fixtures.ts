/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';

import { loginAndGetSessionCookie } from './auth-api';
import { injectSessionCookie } from './auth-ui';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

type Fixtures = {
  authedEngineerPage: import('@playwright/test').Page;
  authedLeadPage: import('@playwright/test').Page;
};

export const test = base.extend<Fixtures>({
  authedEngineerPage: async ({ page, request }, use) => {
    const sessionCookie = await loginAndGetSessionCookie(request, 'ENGINEER');
    await injectSessionCookie(page, sessionCookie, BASE_URL);
    await use(page);
  },

  authedLeadPage: async ({ page, request }, use) => {
    const sessionCookie = await loginAndGetSessionCookie(request, 'LEAD');
    await injectSessionCookie(page, sessionCookie, BASE_URL);
    await use(page);
  },
});

export { expect };
