// src/app/kb/page.tsx
import Link from 'next/link';

import KbHome from './_components/KbHome';

import { getCurrentUser } from '@/lib/roles';

export default async function KbPage() {
  const user = await getCurrentUser();

  // Nema sesije
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">KB Management</h1>
        <p className="mt-2 text-sm opacity-80">You must be logged in to access this page.</p>
        <a className="mt-4 inline-block underline" href="/login">
          Go to login
        </a>
      </main>
    );
  }

  // Nije LEAD
  if (user.role !== 'LEAD') {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">KB Management</h1>
        <p className="mt-2 text-sm text-red-600" data-testid="kb-forbidden">
          Forbidden: LEAD role required.
        </p>
        <Link className="mt-4 inline-block underline" href="/">
          Back home
        </Link>
      </main>
    );
  }

  return <KbHome />;
}
