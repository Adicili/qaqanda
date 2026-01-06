// scripts/promote-user.ts
import { ENV } from '@/lib/env';

type Role = 'ENGINEER' | 'LEAD';

function readArg(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const baseUrl = ENV.BASE_URL ?? 'http://localhost:3000';
  const adminSecret = ENV.ADMIN_SECRET;

  const email = readArg('--email');
  const role = readArg('--role') as Role | null;

  if (!adminSecret) {
    console.error('Missing ADMIN_SECRET env var');
    process.exit(1);
  }

  if (!email || !role || (role !== 'ENGINEER' && role !== 'LEAD')) {
    console.error('Usage: pnpm promote:user -- --email lead@example.com --role LEAD');
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/api/admin/users/promote`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify({ email, role }),
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    console.error(`Failed (${res.status}):`, json);
    process.exit(1);
  }

  console.warn('OK:', json);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
