import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/roles';

type ReportsSummary = {
  total_queries: number;
  avg_latency_ms: number;
  top_questions: string[];
  top_docs: string[];
};

async function fetchSummary(): Promise<ReportsSummary> {
  const res = await fetch('/api/reports/summary', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to load reports');
  }

  return res.json();
}

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!['ENGINEER', 'LEAD'].includes(user.role)) {
    redirect('/');
  }

  let data: ReportsSummary | null = null;
  let error: string | null = null;

  try {
    data = await fetchSummary();
  } catch {
    error = 'Unable to load reports data.';
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="mt-4 text-red-600">{error}</p>
      </div>
    );
  }

  if (!data || data.total_queries === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="mt-4 text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Reports</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total queries</p>
          <p className="text-2xl font-bold">{data.total_queries}</p>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Avg latency (ms)</p>
          <p className="text-2xl font-bold">{data.avg_latency_ms}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-medium mb-2">Top questions</h2>
          <ul className="list-disc pl-5 space-y-1">
            {data.top_questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-medium mb-2">Top KB documents</h2>
          <ul className="list-disc pl-5 space-y-1">
            {data.top_docs.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
