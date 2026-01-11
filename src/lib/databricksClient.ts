// src/lib/databricksClient.ts
import { isDatabricksEnabled, isDatabricksMockEnabled } from '@/lib/dbMode';
import { ENV } from '@/lib/env';

export type SqlParams = Record<string, string | number | boolean | null | undefined>;

// --- MOCK MODE STATE (used when USE_DATABRICKS_MOCK = true) ---

const useDatabricksMock = isDatabricksMockEnabled();

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
};

const mockUsers: UserRow[] = [];

// Tiny helper so we don't explode on undefined

function findEmailInParams(params: SqlParams): string | null {
  if (typeof params.email === 'string') {
    return params.email;
  }

  for (const v of Object.values(params)) {
    if (typeof v === 'string' && v.includes('@')) {
      return v;
    }
  }

  return null;
}

function isUsersTableSelect(normalized: string): boolean {
  // Match: FROM users, FROM default.users, FROM "default".users, etc.
  return /from\s+[\w."`]*users\b/.test(normalized);
}

function isUsersTableInsert(normalized: string): boolean {
  // Match: INSERT INTO users, INSERT INTO default.users, INSERT INTO "default".users, itd.
  return /insert\s+into\s+[\w."`]*users\b/.test(normalized);
}

function executeQueryMock<T>(sql: string, params: SqlParams): T[] {
  const normalized = sql.trim().toLowerCase();

  // --- SELECT ... FROM users WHERE ... email ... ---
  if (
    isUsersTableSelect(normalized) &&
    normalized.includes('where') &&
    normalized.includes('email')
  ) {
    // 1) Try reading email literal from SQL: WHERE ... email = 'foo@bar'
    let emailValue: string | null = null;
    const match = /where\s+.*email.*=\s*'([^']+)'/i.exec(sql);
    if (match) {
      emailValue = match[1];
    } else {
      // 2) Fall back to params: look for an email-like string
      emailValue = findEmailInParams(params);
    }

    if (!emailValue) {
      return [] as T[];
    }

    const emailLower = emailValue.toLowerCase();
    const row = mockUsers.find((u) => u.email.toLowerCase() === emailLower);
    return (row ? [row as unknown as T] : []) as T[];
  }

  // --- INSERT INTO users (...) VALUES (...) ---
  // --- INSERT INTO users (...) VALUES (...) ---
  if (isUsersTableInsert(normalized)) {
    let rowData: Record<string, unknown> = {};

    // Try to parse: INSERT INTO <schema>.users (col1, col2) VALUES (val1, val2)
    const insertMatch = /into\s+[\w."`]*users\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/i.exec(sql);
    if (insertMatch) {
      const colNames = insertMatch[1].split(',').map((s) => s.trim().replace(/["`]/g, ''));
      const values = insertMatch[2].split(',').map((s) => s.trim());

      if (colNames.length === values.length) {
        rowData = {};
        for (let i = 0; i < colNames.length; i++) {
          const col = colNames[i];
          let val = values[i];

          // Strip quotes for string literals
          if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1).replace(/''/g, "'");
          }

          rowData[col] = val;
        }
      }
    }

    const rawId =
      rowData.id ??
      (params as any).id ??
      `local_${(globalThis as any).crypto?.randomUUID?.() ?? Date.now().toString(36)}`;

    const rawEmail = rowData.email ?? findEmailInParams(params) ?? 'unknown@example.com';

    const rawPasswordHash =
      rowData.password_hash ?? (params as any).password_hash ?? (params as any).passwordHash ?? '';

    const rawRole = rowData.role ?? params.role ?? 'ENGINEER';

    const userRow: UserRow = {
      id: String(rawId),
      email: String(rawEmail),
      password_hash: String(rawPasswordHash),
      role: String(rawRole),
      created_at: new Date().toISOString(),
    };

    mockUsers.push(userRow);
    // Repos usually only care that *some* id came back for INSERT
    return [{ id: userRow.id } as unknown as T];
  }

  // --- SELECT * FROM users (no WHERE) ---
  if (isUsersTableSelect(normalized) && !normalized.includes('where')) {
    return mockUsers as unknown as T[];
  }

  // Anything else (kb, queries, etc.) – not needed for current API tests.
  return [] as T[];
}

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
  // Statement Execution API – SUCCEEDED is normal success,
  // FINISHED/CLOSED we also treat as “done”.
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

  // 1) result.data already objects
  if (
    Array.isArray(result?.data) &&
    result.data.length > 0 &&
    typeof result.data[0] === 'object' &&
    !Array.isArray(result.data[0])
  ) {
    return result.data as T[];
  }

  // columns can be in result.schema OR manifest.schema
  const columns =
    result?.schema?.columns ?? json?.schema?.columns ?? json?.manifest?.schema?.columns;

  // data can be in result.data_array OR result.data (as array-of-arrays)
  let dataArray: unknown[][] | null = null;

  if (Array.isArray(result?.data_array)) {
    dataArray = result.data_array as unknown[][];
  } else if (Array.isArray(json?.data_array)) {
    dataArray = json.data_array as unknown[][];
  } else if (
    Array.isArray(result?.data) &&
    result.data.length > 0 &&
    Array.isArray(result.data[0])
  ) {
    dataArray = result.data as unknown[][];
  }

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

  // Always validate/expand params into SQL
  const finalSql = buildSqlWithParams(sql, params);

  if (useDatabricksMock) {
    // Use the final, interpolated SQL – easier to reason about in the mock
    return executeQueryMock<T>(finalSql, params);
  }

  if (!isDatabricksEnabled()) {
    throw new DatabricksClientError('Databricks is disabled (DB_MODE=local)');
  }

  if (!ENV.DATABRICKS_HOST || !ENV.DATABRICKS_TOKEN || !ENV.DATABRICKS_WAREHOUSE_ID) {
    throw new DatabricksClientError('Databricks environment not configured');
  }

  const postUrl = new URL('/api/2.0/sql/statements', ENV.DATABRICKS_HOST).toString();

  // Databricks requires wait_timeout between 5 and 50 seconds
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

      // If it already succeeded inline, we're done
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
