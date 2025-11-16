// lib/env.ts
import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABRICKS_HOST: z.string().url().optional(),
  DATABRICKS_TOKEN: z.string().min(1).optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),

  PORT: z.coerce.number().int().positive().optional(),
  BASE_URL: z.string().url().optional(),
  CI: z
    .union([z.string(), z.boolean(), z.number()])
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      const s = String(v).toLowerCase().trim();
      return s === '1' || s === 'true' || s === 'yes';
    })
    .optional(),
  EXPECTED_TITLE: z.string().min(1).optional(),
});

const parsed = baseSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

const env = parsed.data;

if (env.NODE_ENV === 'production') {
  const missing: string[] = [];
  if (!env.DATABRICKS_HOST) missing.push('DATABRICKS_HOST');
  if (!env.DATABRICKS_TOKEN) missing.push('DATABRICKS_TOKEN');
  if (missing.length) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

export const ENV = {
  NODE_ENV: env.NODE_ENV,
  DATABRICKS_HOST: env.DATABRICKS_HOST,
  DATABRICKS_TOKEN: env.DATABRICKS_TOKEN,
  OPENAI_API_KEY: env.OPENAI_API_KEY,
  PORT: env.PORT,
  BASE_URL: env.BASE_URL,
  CI: env.CI,
  EXPECTED_TITLE: env.EXPECTED_TITLE,
} as const;
