// tests/support/cookies.ts

/**
 * Extracts a single cookie "name=value" pair from a Set-Cookie header.
 * Handles multiple cookies in a single header string.
 */
export function extractCookieFromSetCookie(setCookieHeader: string, cookieName: string) {
  // Split only between cookies (commas can appear in Expires attribute)
  const parts = setCookieHeader.split(/,(?=[^;]+=[^;]+)/g);
  const hit = parts.find((p) => p.trim().startsWith(`${cookieName}=`));
  return hit ? hit.split(';')[0].trim() : null;
}
