// lib/databricksClient.ts
import { ENV } from '@/lib/env';

export type SqlParams = Record<string, string | number | boolean | null | undefined>;

export interface DatabricksClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export class DatabricksClientError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DatabricksClientError';
    this.status = status;
  }
}

export class DatabricksTimeoutError extends DatabricksClientError {
  constructor(message = 'Databricks request timed out') {
    super(message);
    this.name = 'DatabricksTimeoutError';
  }
}

interface DatabricksSqlResponse {
  status?: {
    state?: string;
  };
  result?: {
    data_array?: unknown[][];
    schema?: {
      columns: { name: string; type_text?: string }[];
    };
  };
}

function escapeSqlValue(value: SqlParams[keyof SqlParams]): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new DatabricksClientError('Non-finite number in SQL parameter');
    }
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  const sanitized = value.replace(/'/g, "''");
  return `'${sanitized}'`;
}

export function buildSqlWithParams(sql: string, params: SqlParams = {}): string {
  const usedKeys = new Set<string>();

  const result = sql.replace(/:([a-zA-Z0-9_]+)/g, (match, paramName: string) => {
    if (!(paramName in params)) {
      throw new DatabricksClientError(`Missing SQL parameter :${paramName}`);
    }
    usedKeys.add(paramName);
    return escapeSqlValue(params[paramName]);
  });

  const unusedParams = Object.keys(params).filter((key) => !usedKeys.has(key));
  if (unusedParams.length > 0) {
    throw new DatabricksClientError(
      `Unused SQL parameters: ${unusedParams.map((k) => `:${k}`).join(', ')}`,
    );
  }

  return result;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new DatabricksTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  params: SqlParams = {},
  options: DatabricksClientOptions = {},
): Promise<T[]> {
  const { timeoutMs = 15_000, maxRetries = 2 } = options;

  if (!ENV.DATABRICKS_HOST || !ENV.DATABRICKS_TOKEN) {
    throw new DatabricksClientError('Databricks environment not configured');
  }

  const finalSql = buildSqlWithParams(sql, params);

  const url = new URL('/api/2.0/sql/statements', ENV.DATABRICKS_HOST).toString();

  const body = JSON.stringify({
    statement: finalSql,
  });

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ENV.DATABRICKS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body,
        },
        timeoutMs,
      );

      if (!response.ok) {
        if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
          lastError = new DatabricksClientError(
            `Databricks 5xx response (attempt ${attempt + 1})`,
            response.status,
          );
          continue;
        }

        const text = await response.text().catch(() => '');
        throw new DatabricksClientError(
          `Databricks request failed with status ${response.status}: ${text}`,
          response.status,
        );
      }

      const json = (await response.json()) as DatabricksSqlResponse;

      const state = json.status?.state;
      if (state && state !== 'FINISHED') {
        throw new DatabricksClientError(`Databricks statement not finished. State=${state}`);
      }

      const data = json.result?.data_array ?? [];
      const columns = json.result?.schema?.columns ?? [];

      if (data.length === 0 || columns.length === 0) {
        return [] as T[];
      }

      const colNames = columns.map((c) => c.name);

      const mapped = data.map((row) => {
        const obj: Record<string, unknown> = {};
        row.forEach((value, idx) => {
          const key = colNames[idx] ?? `col_${idx}`;
          obj[key] = value;
        });
        return obj as T;
      });

      return mapped;
    } catch (err: any) {
      const isTimeout = err instanceof DatabricksTimeoutError;
      const isNetworkErr =
        err?.name === 'FetchError' || err?.code === 'ECONNRESET' || err?.code === 'ECONNREFUSED';

      if ((isTimeout || isNetworkErr) && attempt < maxRetries) {
        lastError = err;
        continue;
      }

      throw err;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new DatabricksClientError('Databricks request failed after retries');
}
