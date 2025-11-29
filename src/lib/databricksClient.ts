// src/lib/databricksClient.ts
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
  statement_id?: string;
  status?: {
    state?: string;
    error?: {
      message?: string;
      error_code?: string;
    } | null;
    error_code?: string;
    error_message?: string;
  };
  manifest?: {
    format?: string;
    schema?: {
      column_count?: number;
      columns: { name: string; type_text?: string; type_name?: string; position?: number }[];
    };
    total_chunk_count?: number;
    total_row_count?: number;
    truncated?: boolean;
  };
  result?: {
    data_array?: unknown[][];
    data?: unknown[];
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

  const sanitized = String(value).replace(/'/g, "''");
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

function isTerminalSuccess(state?: string): boolean {
  // Statement Execution API – SUCCEEDED je normalan success,
  // FINISHED/CLOSED uzimamo kao “ok, gotovo”
  return state === 'SUCCEEDED' || state === 'FINISHED' || state === 'CLOSED' || !state;
}

function isTerminalFailure(state?: string): boolean {
  return state === 'FAILED' || state === 'CANCELED';
}

function extractErrorMessage(payload: DatabricksSqlResponse): string {
  const s: any = payload.status ?? {};
  return (
    s?.error?.message ||
    s?.error_message ||
    s?.error?.error_code ||
    s?.error_code ||
    JSON.stringify(s.error ?? s, null, 2)
  );
}

function mapResult<T = Record<string, unknown>>(json: any): T[] {
  const result = json?.result ?? json;

  // 1) Format: result.data je već niz objekata { c: 2, ... }
  if (Array.isArray(result?.data) && result.data.length > 0 && typeof result.data[0] === 'object') {
    return result.data as T[];
  }

  // 2) Generalizovani array-of-arrays format
  const columns =
    result?.schema?.columns ?? json?.schema?.columns ?? json?.manifest?.schema?.columns;

  const dataArray = result?.data_array ?? json?.data_array;

  if (Array.isArray(dataArray) && Array.isArray(columns)) {
    const colNames = columns.map((c: any) => c.name);

    return dataArray.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {};
      row.forEach((value, idx) => {
        const key = colNames[idx] ?? `col_${idx}`;
        obj[key] = value;
      });
      return obj as T;
    });
  }

  console.warn(
    '[DatabricksClient] Unrecognized result format, returning [] – raw payload:',
    JSON.stringify(json, null, 2),
  );

  return [] as T[];
}

async function pollStatementStatus(
  statementId: string,
  timeoutMs: number,
): Promise<DatabricksSqlResponse> {
  const start = Date.now();
  const pollIntervalMs = 500;

  const statusUrl = new URL(
    `/api/2.0/sql/statements/${statementId}`,
    ENV.DATABRICKS_HOST,
  ).toString();

  while (true) {
    const elapsed = Date.now() - start;
    if (elapsed > timeoutMs) {
      throw new DatabricksTimeoutError(
        `Databricks statement polling timed out after ${timeoutMs}ms (id=${statementId})`,
      );
    }

    const res = await fetchWithTimeout(
      statusUrl,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ENV.DATABRICKS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
      timeoutMs,
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new DatabricksClientError(
        `Databricks GET status failed with status ${res.status}: ${text}`,
        res.status,
      );
    }

    const json = (await res.json()) as DatabricksSqlResponse;
    const state = json.status?.state;

    if (isTerminalSuccess(state)) {
      return json;
    }

    if (isTerminalFailure(state)) {
      const msg = extractErrorMessage(json);
      throw new DatabricksClientError(
        `Databricks statement failed. State=${state}. Details: ${msg}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  params: SqlParams = {},
  options: DatabricksClientOptions = {},
): Promise<T[]> {
  const { timeoutMs = 15_000, maxRetries = 2 } = options;

  if (!ENV.DATABRICKS_HOST || !ENV.DATABRICKS_TOKEN || !ENV.DATABRICKS_WAREHOUSE_ID) {
    throw new DatabricksClientError('Databricks environment not configured');
  }

  const finalSql = buildSqlWithParams(sql, params);

  const postUrl = new URL('/api/2.0/sql/statements', ENV.DATABRICKS_HOST).toString();

  // Databricks traži wait_timeout između 5 i 50 sekundi
  const timeoutSeconds = Math.min(Math.max(Math.floor(timeoutMs / 1000), 5), 50);

  const body = JSON.stringify({
    statement: finalSql,
    warehouse_id: ENV.DATABRICKS_WAREHOUSE_ID,
    disposition: 'INLINE',
    format: 'JSON_ARRAY',
    wait_timeout: `${timeoutSeconds}s`,
  });

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        postUrl,
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

      // Ako je već uspeo i imamo rezultat inline – gotovo
      if (isTerminalSuccess(state)) {
        return mapResult<T>(json);
      }

      const statementId = json.statement_id;
      if (!statementId) {
        throw new DatabricksClientError(
          `Databricks statement not finished and no statement_id. State=${state ?? 'UNKNOWN'}`,
        );
      }

      const finalJson = await pollStatementStatus(statementId, timeoutMs);
      return mapResult<T>(finalJson);
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
