export function extractCookieFromSetCookie(
  setCookieHeader: unknown,
  cookieName: string,
): string | null {
  const raw = String(setCookieHeader ?? '');
  const idx = raw.indexOf(`${cookieName}=`);
  if (idx === -1) return null;

  const slice = raw.slice(idx);
  const firstPart = slice.split(';')[0]?.trim(); // "name=value"
  return firstPart || null;
}
