// src/app/kb/_components/KbHome.tsx
'use client';

import Link from 'next/link';
import * as React from 'react';

type ApiOk = { success: true; id: string };
type ApiErr = { error?: string; details?: unknown };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    const msg = (json && (json.error as string)) || `Request failed (${res.status})`;
    const err: ApiErr = { error: msg, details: json?.details };
    throw err;
  }

  return json as T;
}

function Alert({
  kind,
  children,
  testId,
}: {
  kind: 'error' | 'success' | 'info';
  children: React.ReactNode;
  testId?: string;
}) {
  const cls =
    kind === 'error'
      ? 'border-red-300 bg-red-50 text-red-800'
      : kind === 'success'
        ? 'border-green-300 bg-green-50 text-green-800'
        : 'border-neutral-300 bg-neutral-50 text-neutral-800';

  return (
    <div className={`mt-3 rounded-md border p-3 text-sm ${cls}`} data-testid={testId}>
      {children}
    </div>
  );
}

export default function KbHome() {
  // ADD
  const [addPrompt, setAddPrompt] = React.useState('');
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [addOkId, setAddOkId] = React.useState<string | null>(null);

  // UPDATE
  const [updId, setUpdId] = React.useState('');
  const [updPrompt, setUpdPrompt] = React.useState('');
  const [updLoading, setUpdLoading] = React.useState(false);
  const [updError, setUpdError] = React.useState<string | null>(null);
  const [updOkId, setUpdOkId] = React.useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddOkId(null);

    const prompt = addPrompt.trim();
    if (!prompt) {
      setAddError('Prompt is required.');
      return;
    }

    setAddLoading(true);
    try {
      const json = await postJson<ApiOk>('/api/kb/add', { prompt });
      setAddOkId(json.id);
      setAddPrompt('');
    } catch (err: any) {
      setAddError(err?.error || 'Request failed');
    } finally {
      setAddLoading(false);
    }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdError(null);
    setUpdOkId(null);

    const id = updId.trim();
    const prompt = updPrompt.trim();

    if (!id) {
      setUpdError('KB id is required.');
      return;
    }
    if (!prompt) {
      setUpdError('Prompt is required.');
      return;
    }

    setUpdLoading(true);
    try {
      const json = await postJson<ApiOk>('/api/kb/update', { id, prompt });
      setUpdOkId(json.id);
      setUpdPrompt('');
    } catch (err: any) {
      setUpdError(err?.error || 'Request failed');
    } finally {
      setUpdLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6" data-testid="kb-page">
      <header className="flex items-start justify-between gap-4" data-testid="kb-header">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="kb-title">
            KB Management
          </h1>
          <p className="mt-1 text-sm opacity-80" data-testid="kb-subtitle">
            EP05 UI: Add and Update KB entries (LEAD only).
          </p>
        </div>

        <Link className="text-sm underline" href="/" data-testid="kb-home-link">
          Home
        </Link>
      </header>

      <div className="mt-6 grid gap-6" data-testid="kb-content">
        {/* ADD */}
        <section className="rounded-lg border p-4" data-testid="kb-add-section">
          <h2 className="text-lg font-semibold" data-testid="kb-add-title">
            Add entry
          </h2>

          <form className="mt-4 grid gap-3" onSubmit={onAdd} data-testid="kb-add-form">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Prompt</span>
              <textarea
                className="min-h-28 w-full rounded-md border p-2 text-sm"
                value={addPrompt}
                onChange={(e) => setAddPrompt(e.target.value)}
                placeholder="Describe the KB entry you want to generate..."
                data-testid="kb-add-prompt"
              />
            </label>

            <button
              className="inline-flex w-fit items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
              type="submit"
              disabled={addLoading}
              data-testid="kb-add-submit"
            >
              {addLoading ? 'Adding...' : 'Add'}
            </button>

            {addError && (
              <Alert kind="error" testId="kb-add-error">
                {addError}
              </Alert>
            )}

            {addOkId && (
              <Alert kind="success" data-testid="kb-add-success">
                Saved. New KB id: <code data-testid="kb-add-id">{addOkId}</code>
              </Alert>
            )}
          </form>
        </section>

        {/* UPDATE */}
        <section className="rounded-lg border p-4" data-testid="kb-update-section">
          <h2 className="text-lg font-semibold" data-testid="kb-update-title">
            Update entry
          </h2>

          <form className="mt-4 grid gap-3" onSubmit={onUpdate} data-testid="kb-update-form">
            <label className="grid gap-1">
              <span className="text-sm font-medium">KB id</span>
              <input
                className="w-full rounded-md border p-2 text-sm"
                value={updId}
                onChange={(e) => setUpdId(e.target.value)}
                placeholder="e.g. kb_123..."
                data-testid="kb-update-id"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Prompt</span>
              <textarea
                className="min-h-28 w-full rounded-md border p-2 text-sm"
                value={updPrompt}
                onChange={(e) => setUpdPrompt(e.target.value)}
                placeholder="Describe what should change in this KB entry..."
                data-testid="kb-update-prompt"
              />
            </label>

            <button
              className="inline-flex w-fit items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
              type="submit"
              disabled={updLoading}
              data-testid="kb-update-submit"
            >
              {updLoading ? 'Updating...' : 'Update'}
            </button>

            {updError && (
              <Alert kind="error" testId="kb-update-error">
                {updError}
              </Alert>
            )}

            {updOkId && (
              <Alert kind="success" data-testid="kb-update-success">
                Updated KB id: <code data-testid="kb-update-id-value">{updOkId}</code>
              </Alert>
            )}
          </form>
        </section>

        {/* NOTE */}
        <section className="rounded-lg border p-4" data-testid="kb-note-section">
          <h3 className="text-base font-semibold" data-testid="kb-note-title">
            Note
          </h3>
          <p className="mt-1 text-sm opacity-80" data-testid="kb-note-text">
            API currently generates & saves immediately. Preview/confirm flow is intentionally
            deferred to EP06+.
          </p>
        </section>
      </div>
    </main>
  );
}
