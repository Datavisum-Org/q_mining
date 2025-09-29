import type { PoolClient } from "pg";

import { runOne, runQuery } from "@/lib/repositories/helpers";
import type {
  MarketDataCacheInsert,
  MarketDataCacheRecord,
  MarketDataCacheRow,
} from "@/types/database";

const MARKET_COLUMNS = `
  id,
  btc_price_usd,
  network_hash_rate_ehs,
  difficulty,
  block_reward,
  price_source,
  hash_rate_source,
  fetched_at
`;

function mapRow(row: MarketDataCacheRow): MarketDataCacheRecord {
  return {
    id: row.id,
    btcPriceUsd: Number(row.btc_price_usd),
    networkHashRateEhs: Number(row.network_hash_rate_ehs),
    difficulty: Number(row.difficulty),
    blockReward: row.block_reward ? Number(row.block_reward) : 0,
    priceSource: row.price_source,
    hashRateSource: row.hash_rate_source,
    fetchedAt: row.fetched_at,
  };
}

export async function insertMarketData(
  input: MarketDataCacheInsert,
  client?: PoolClient,
): Promise<MarketDataCacheRecord> {
  const rows = await runQuery<MarketDataCacheRow>({
    ...(client ? { client } : {}),
    query: `INSERT INTO market_data_cache (
      btc_price_usd,
      network_hash_rate_ehs,
      difficulty,
      block_reward,
      price_source,
      hash_rate_source,
      fetched_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING ${MARKET_COLUMNS}`,
    params: [
      input.btcPriceUsd,
      input.networkHashRateEhs,
      input.difficulty,
      input.blockReward ?? 3.125,
      input.priceSource,
      input.hashRateSource,
      (input.fetchedAt ?? new Date()).toISOString(),
    ],
  });

  const [row] = rows;
  if (!row) {
    throw new Error("Failed to insert market data record");
  }

  return mapRow(row);
}

export async function getLatestMarketData(): Promise<MarketDataCacheRecord | null> {
  const row = await runOne<MarketDataCacheRow>({
    query: `SELECT ${MARKET_COLUMNS}
            FROM market_data_cache
            ORDER BY fetched_at DESC
            LIMIT 1`,
  });

  return row ? mapRow(row) : null;
}

export async function pruneStaleMarketData(client?: PoolClient): Promise<void> {
  await runQuery({
    ...(client ? { client } : {}),
    query: "DELETE FROM market_data_cache WHERE fetched_at < NOW() - INTERVAL '7 days'",
  });
}
