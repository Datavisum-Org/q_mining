import type { PoolClient, QueryResultRow } from "pg";

import { db } from "@/lib/db";

interface QueryOptions {
  query: string;
  params?: unknown[];
  client?: PoolClient;
}

export async function runQuery<T extends QueryResultRow = QueryResultRow>({
  query,
  params = [],
  client,
}: QueryOptions): Promise<T[]> {
  if (client) {
    const result = await client.query<T>(query, params);
    return result.rows as T[];
  }

  return db.query<T>(query, params);
}

export async function runOne<T extends QueryResultRow = QueryResultRow>(
  options: QueryOptions,
): Promise<T | null> {
  const rows = await runQuery<T>(options);
  return rows[0] ?? null;
}
