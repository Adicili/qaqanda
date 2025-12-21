// app/page.tsx
import { cookies } from 'next/headers';

import LandingHome from './_components/LandingHome';
import AskHome from './_components/AskHome';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

export default async function HomePage() {
  const cookieStore = cookies();
  const token = (await cookieStore).get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  // Nema sesije => landing
  if (!session) {
    return <LandingHome />;
  }

  // Ima sesije => ask UI
  return <AskHome />;
}
