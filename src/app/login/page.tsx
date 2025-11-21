// app/login/page.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const isValid = validate();
    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 200) {
        // Happy path – login uspeo, server postavlja cookie
        router.push('/');
        return;
      }

      if (response.status === 401) {
        setFormError('Invalid email or password');
        return;
      }

      if (response.status === 400) {
        setFormError('Please check your input and try again');
        return;
      }

      setFormError('Something went wrong. Please try again.');
    } catch (error) {
      console.error('Login error:', error);
      setFormError('Unable to login right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-50 mb-2" data-test-id="login-title">
          Login to QAQ&A
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Enter your credentials to access your dashboard.
        </p>

        {formError && (
          <div
            data-test-id="login-error"
            className="mb-4 rounded-md border border-red-500 bg-red-950/60 px-3 py-2 text-sm text-red-200"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              data-test-id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-300" data-test-id="login-emailError">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              data-test-id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-300" data-test-id="login-passwordError">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            data-test-id="login-submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-sky-400 hover:text-sky-300 underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
