'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { registerSchema } from '@/schemas/auth';

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
  global?: string;
};

const initialState: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function validateClient(current: FormState): boolean {
    const result = registerSchema.safeParse(current);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: FormErrors = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0];
      const message = issue.message;

      if (field === 'email' || field === 'password' || field === 'confirmPassword') {
        const key = field as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key]!.push(message);
      } else {
        fieldErrors.global = message;
      }
    }

    setErrors(fieldErrors);
    return false;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isValid = validateClient(form);
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setForm(initialState);
        setErrors({});
        router.push('/login');
        return;
      }

      let json: any = null;
      try {
        json = await response.json();
      } catch {
        // ignore JSON parse errors
      }

      if (json && json.errors) {
        const next: FormErrors = {};

        if (json.errors.email) {
          next.email = json.errors.email as string[];
        }
        if (json.errors.password) {
          next.password = json.errors.password as string[];
        }
        if (json.errors.confirmPassword) {
          next.confirmPassword = json.errors.confirmPassword as string[];
        }

        if (json.error && typeof json.error === 'string') {
          next.global = json.error;
        }

        setErrors(next);
      } else {
        setErrors({ global: 'Something went wrong. Please try again.' });
      }
    } catch {
      setErrors({ global: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBlur() {
    validateClient(form);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      {' '}
      {}
      <section className="w-full max-w-md rounded-lg bg-slate-900 p-6 shadow-lg">
        {' '}
        {}
        <h1
          className="mb-4 text-center text-2xl font-semibold text-slate-50"
          data-testid="register-title"
        >
          {' '}
          {}
          Create your QAQ&amp;A account {}
        </h1>
        {errors.global && (
          <div
            className="mb-4 rounded border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200"
            data-testid="register-global-error"
          >
            {errors.global}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form" noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur}
              data-testid="register-email"
            />
            {errors.email && errors.email.length > 0 && (
              <ul
                className="mt-1 space-y-0.5 text-xs text-red-300"
                data-testid="register-email-errors"
              >
                {errors.email.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.password}
              onChange={handleChange('password')}
              onBlur={handleBlur}
              data-testid="register-password"
            />
            {errors.password && errors.password.length > 0 && (
              <ul
                className="mt-1 space-y-0.5 text-xs text-red-300"
                data-testid="register-password-errors"
              >
                {errors.password.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-slate-400">
              At least 8 characters, one number and one special character.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur}
              data-testid="register-confirmPassword"
            />
            {errors.confirmPassword && errors.confirmPassword.length > 0 && (
              <ul
                className="mt-1 space-y-0.5 text-xs text-red-300"
                data-testid="register-confirmPassword-errors"
              >
                {errors.confirmPassword.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="register-submit"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="mt-3 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Log in
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
