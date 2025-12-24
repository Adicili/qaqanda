export async function injectSessionCookie(page: any, rawCookie: string, baseUrl: string) {
  if (!rawCookie) {
    throw new Error('injectSessionCookie: rawCookie is empty');
  }

  if (!baseUrl) {
    throw new Error('injectSessionCookie: baseUrl is empty');
  }

  let cookieUrl: string;
  try {
    // ⚠️ Playwright hoće FULL URL sa path-om
    cookieUrl = new URL('/', baseUrl).toString(); // e.g. http://localhost:3000/
  } catch {
    throw new Error(`injectSessionCookie: invalid baseUrl "${baseUrl}"`);
  }

  const eqIndex = rawCookie.indexOf('=');
  if (eqIndex === -1) {
    throw new Error(`injectSessionCookie: invalid cookie format "${rawCookie}"`);
  }

  const name = rawCookie.slice(0, eqIndex).trim();
  const value = rawCookie.slice(eqIndex + 1).trim();

  if (!name || !value) {
    throw new Error(`injectSessionCookie: empty name/value from "${rawCookie}"`);
  }

  await page.context().addCookies([
    {
      name,
      value,
      url: cookieUrl,
    },
  ]);
}
