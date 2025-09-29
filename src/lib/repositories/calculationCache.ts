import type { PoolClient } from "pg";

import { runOne, runQuery } from "@/lib/repositories/helpers";
import type {
  CalculationCacheInsert,
  CalculationCacheRecord,
  CalculationCacheRow,
} from "@/types/database";

const CALCULATION_COLUMNS = `
  id,
  parameters_hash,
  results,
  calculated_at,
  expires_at
`;

function mapRow(row: CalculationCacheRow): CalculationCacheRecord {
  return {
    id: row.id,
    parametersHash: row.parameters_hash,
    results: row.results,
    calculatedAt: row.calculated_at,
    expiresAt: row.expires_at,
  };
}

export async function getCalculationCache(
  parametersHash: string,
): Promise<CalculationCacheRecord | null> {
  const row = await runOne<CalculationCacheRow>({
    query: `SELECT ${CALCULATION_COLUMNS}
            FROM calculation_cache
            WHERE parameters_hash = $1
            LIMIT 1`,
    params: [parametersHash],
  });

  return row ? mapRow(row) : null;
}

export async function upsertCalculationCache(
  input: CalculationCacheInsert,
  client?: PoolClient,
): Promise<CalculationCacheRecord> {
  const rows = await runQuery<CalculationCacheRow>({
    ...(client ? { client } : {}),
    query: `INSERT INTO calculation_cache (
      parameters_hash,
      results,
      calculated_at,
      expires_at
    )
    VALUES ($1, $2, NOW(), $3)
    ON CONFLICT (parameters_hash) DO UPDATE SET
      results = EXCLUDED.results,
      calculated_at = NOW(),
      expires_at = EXCLUDED.expires_at
    RETURNING ${CALCULATION_COLUMNS}`,
    params: [input.parametersHash, input.results, input.expiresAt.toISOString()],
  });

  const [row] = rows;
  if (!row) {
    throw new Error("Failed to upsert calculation cache record");
  }

  return mapRow(row);
}

export async function purgeExpiredCalculationCache(client?: PoolClient): Promise<void> {
  await runQuery({
    ...(client ? { client } : {}),
    query: "DELETE FROM calculation_cache WHERE expires_at < NOW()",
  });
}
