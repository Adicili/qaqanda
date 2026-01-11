// lib/env.ts
import { z } from 'zod';

const emptyToUndefined = (v: unknown) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length === 0 ? undefined : s;
};

const baseSchema = z.object({
  STORAGE_MODE: z.enum(['local', 'databricks', 'databricks_mock']).optional(),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  ADMIN_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),

  DATABRICKS_HOST: z.preprocess(emptyToUndefined, z.string().url().optional()),
  DATABRICKS_TOKEN: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  DATABRICKS_WAREHOUSE_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

  PORT: z.coerce.number().int().positive().optional(),
  BASE_URL: z.preprocess(emptyToUndefined, z.string().default('http://localhost:3000')),

  LLM_MODE: z.enum(['mock', 'real']).default('mock'),
  MOCK_LLM_BAD: z.coerce.boolean().default(false),

  CI: z
    .union([z.string(), z.boolean(), z.number()])
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      const s = String(v).toLowerCase().trim();
      return s === '1' || s === 'true' || s === 'yes';
    })
    .optional(),

  USE_DATABRICKS_MOCK: z
    .union([z.string(), z.boolean(), z.number()])
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      const s = String(v).toLowerCase().trim();
      return s === '1' || s === 'true' || s === 'yes';
    })
    .default(false),

  EXPECTED_TITLE: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars'),

  // ✅ new localdb opts
  LOCAL_DB_PATH: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  LOCAL_DB_LOCK_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  LOCAL_DB_STALE_LOCK_MS: z.coerce.number().int().positive().optional(),
});

const parsed = baseSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

const env = parsed.data;

// ---------------------------------------------------
// Production Databricks guard
// ---------------------------------------------------
const forceMock = env.USE_DATABRICKS_MOCK === true;
const isCi = env.CI === true;

if (env.NODE_ENV === 'production' && !forceMock && !isCi) {
  const missing: string[] = [];

  if (!env.DATABRICKS_HOST) missing.push('DATABRICKS_HOST');
  if (!env.DATABRICKS_TOKEN) missing.push('DATABRICKS_TOKEN');
  if (!env.DATABRICKS_WAREHOUSE_ID) missing.push('DATABRICKS_WAREHOUSE_ID');

  if (missing.length) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

export const ENV = {
  STORAGE_MODE: env.STORAGE_MODE,

  NODE_ENV: env.NODE_ENV,
  ADMIN_SECRET: env.ADMIN_SECRET,

  DATABRICKS_HOST: env.DATABRICKS_HOST,
  DATABRICKS_TOKEN: env.DATABRICKS_TOKEN,
  DATABRICKS_WAREHOUSE_ID: env.DATABRICKS_WAREHOUSE_ID,

  OPENAI_API_KEY: env.OPENAI_API_KEY,

  PORT: env.PORT,
  BASE_URL: env.BASE_URL,

  CI: env.CI,

  LLM_MODE: env.LLM_MODE,
  MOCK_LLM_BAD: env.MOCK_LLM_BAD,

  EXPECTED_TITLE: env.EXPECTED_TITLE,

  SESSION_SECRET: env.SESSION_SECRET,

  USE_DATABRICKS_MOCK: env.USE_DATABRICKS_MOCK,

  LOCAL_DB_PATH: env.LOCAL_DB_PATH,
  LOCAL_DB_LOCK_TIMEOUT_MS: env.LOCAL_DB_LOCK_TIMEOUT_MS,
  LOCAL_DB_STALE_LOCK_MS: env.LOCAL_DB_STALE_LOCK_MS,
} as const;
