/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';

import { ensureEngineerUser, loginAndGetSessionCookie } from './auth-api';
import { injectSessionCookie } from './auth-ui';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

type Fixtures = {
  authedPage: import('@playwright/test').Page;
};

export const test = base.extend<Fixtures>({
  authedPage: async ({ page, request }, use) => {
    const creds = await ensureEngineerUser(request);
    const sessionCookie = await loginAndGetSessionCookie(request, creds);
    await injectSessionCookie(page, sessionCookie, BASE_URL);

    await use(page);
  },
});

export { expect } from '@playwright/test';
