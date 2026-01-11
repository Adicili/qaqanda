// app/_components/AskHome.tsx
'use client';

import Link from 'next/link';
import * as React from 'react';

export default function AskHome() {
  const [question, setQuestion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [context, setContext] = React.useState<any[]>([]);
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/me', { method: 'GET' });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        setRole(json?.role ?? null);
      } catch {
        if (!alive) return;
        setRole(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) {
      setError('Question is required.');
      setAnswer(null);
      setContext([]);
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setContext([]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError((json && json.error) || 'Request failed');
        return;
      }

      setAnswer(json.answer ?? '');
      setContext(Array.isArray(json.context) ? json.context : []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });

    const text = await res.text().catch(() => '');
    console.warn('logout status:', res.status, 'body:', text);

    // Ako nije 200 -> nema logout-a.
    if (!res.ok) return;

    window.location.href = '/login';
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <header className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-50" data-test-id="ask-title">
            Ask QAQ&amp;A
          </h1>

          <nav className="flex items-center gap-4 text-sm">
            {role === 'LEAD' && (
              <Link
                href="/kb"
                className="text-slate-200 underline hover:text-slate-50"
                data-test-id="nav-kb-link"
              >
                KB
              </Link>
            )}

            {(role === 'ENGINEER' || role === 'LEAD') && (
              <Link
                href="/reports"
                className="text-slate-200 underline hover:text-slate-50"
                data-test-id="nav-reports-link"
              >
                Reports
              </Link>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="text-slate-300 underline hover:text-slate-50"
              data-test-id="nav-logout"
            >
              Logout
            </button>
          </nav>
        </header>

        <form onSubmit={onSubmit} className="mt-5 space-y-3" noValidate>
          <label className="block text-sm font-medium text-slate-200" htmlFor="ask-question">
            Your question
          </label>
          <input
            id="ask-question"
            data-test-id="ask-input"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            data-test-id="ask-submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Ask'}
          </button>

          {error && (
            <div
              data-test-id="ask-error"
              className="rounded-md border border-red-500 bg-red-950/60 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}
        </form>

        {answer !== null && (
          <div className="mt-6 rounded-md border border-slate-800 bg-slate-950/40 p-4">
            <h2 className="text-sm font-semibold text-slate-100">Answer</h2>
            <p
              data-test-id="ask-answer"
              className="mt-2 text-sm text-slate-200 whitespace-pre-wrap"
            >
              {answer}
            </p>
          </div>
        )}

        <div className="mt-5">
          <h2 className="text-sm font-semibold text-slate-100">Context</h2>
          {context.length === 0 ? (
            <p data-test-id="ask-context-empty" className="mt-2 text-xs text-slate-400">
              No relevant documents found.
            </p>
          ) : (
            <ul data-test-id="ask-context" className="mt-2 space-y-2">
              {context.map((c: any) => (
                <li key={c.id} className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-sm font-medium text-slate-100">{c.title}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
