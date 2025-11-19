import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      {}
      <section className="w-full max-w-2xl rounded-lg bg-slate-900 p-8 shadow-xl">
        {}
        <h1 className="mb-3 text-center text-3xl font-bold text-slate-50">
          QAQ&amp;A — Internal QA Knowledge Hub
        </h1>

        {}
        <p className="mb-6 text-center text-sm text-slate-300">
          Central place for QA engineers to ask questions, explore test strategies, and document
          automation practices around Databricks, Playwright, CI/CD and LLM-powered workflows.
        </p>

        {}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {}
          <div className="rounded-md border border-slate-700 bg-slate-950/60 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">Structured test strategy</h2>
            <p className="text-xs text-slate-400">
              Epics, user stories, and traceable test cases mapped directly to automated checks in
              your repo.
            </p>
          </div>

          {}
          <div className="rounded-md border border-slate-700 bg-slate-950/60 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">
              Playwright-first automation
            </h2>
            <p className="text-xs text-slate-400">
              API &amp; UI tests with tagging by epic and test case ID, ready for CI and reporting.
            </p>
          </div>

          {}
          <div className="rounded-md border border-slate-700 bg-slate-950/60 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">
              Databricks integration ready
            </h2>
            <p className="text-xs text-slate-400">
              Designed to plug into Databricks for analytics, reporting and knowledge retrieval.
            </p>
          </div>

          {}
          <div className="rounded-md border border-slate-700 bg-slate-950/60 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">AI-assisted QA workflows</h2>
            <p className="text-xs text-slate-400">
              Future-ready ask engine and LLM enhancements to support test design and triage.
            </p>
          </div>
        </div>

        {}
        <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
          {}
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 md:w-auto"
            data-testid="home-register-link"
          >
            Create QAQ&amp;A account
          </Link>

          {}
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 md:w-auto"
            data-testid="home-login-link"
          >
            I already have an account
          </Link>
        </div>

        {}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          This project is built as a QA-focused portfolio: strong test strategy, automation-first
          design, and CI-ready quality gates.
        </p>
      </section>
    </main>
  );
}
