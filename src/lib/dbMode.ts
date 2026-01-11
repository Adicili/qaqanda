import { ENV } from '@/lib/env';

export function isDatabricksEnabled(): boolean {
  if (ENV.DB_MODE !== 'databricks') return false;
  return Boolean(ENV.DATABRICKS_HOST && ENV.DATABRICKS_TOKEN && ENV.DATABRICKS_WAREHOUSE_ID);
}

export function isDatabricksMockEnabled(): boolean {
  // mock ima smisla samo kad je izabran databricks mode (inače si već local)
  return ENV.DB_MODE === 'databricks' && ENV.USE_DATABRICKS_MOCK === true;
}
