import crypto from "node:crypto";

import type { CalculationAssumptions, MarketConditions, MiningParameters } from "@/types/mining";
import { calculationCacheRepository, marketDataRepository } from "@/lib/repositories";

const MARKET_CACHE_TTL_SECONDS = 3600;
const CALCULATION_CACHE_TTL_SECONDS = 30;

export interface CachedMarketData {
  id: string;
  btcPriceUSD: number;
  networkHashRateEHS: number;
  difficulty: number;
  blockReward: number;
  priceSource: string;
  hashRateSource: string;
  fetchedAt: Date;
}

export interface CachedCalculationRecord<T> {
  key: string;
  result: T;
  expiresAt: Date;
}

export function isCacheFresh(fetchedAt: Date, ttlSeconds: number): boolean {
  const ageSeconds = (Date.now() - fetchedAt.getTime()) / 1000;
  return ageSeconds < ttlSeconds;
}

export async function getCachedMarketData(): Promise<CachedMarketData | null> {
  const cached = await marketDataRepository.getLatestMarketData();
  if (!cached) {
    return null;
  }

  return {
    id: cached.id,
    btcPriceUSD: cached.btcPriceUsd,
    networkHashRateEHS: cached.networkHashRateEhs,
    difficulty: cached.difficulty,
    blockReward: cached.blockReward,
    priceSource: cached.priceSource,
    hashRateSource: cached.hashRateSource,
    fetchedAt: new Date(cached.fetchedAt),
  };
}

export async function setCachedMarketData(data: {
  btcPriceUSD: number;
  networkHashRateEHS: number;
  difficulty: number;
  blockReward: number;
  priceSource: string;
  hashRateSource: string;
  fetchedAt: Date;
}) {
  const { fetchedAt, ...requiredFields } = data;

  await marketDataRepository.insertMarketData({
    btcPriceUsd: requiredFields.btcPriceUSD,
    networkHashRateEhs: requiredFields.networkHashRateEHS,
    difficulty: requiredFields.difficulty,
    blockReward: requiredFields.blockReward,
    priceSource: requiredFields.priceSource,
    hashRateSource: requiredFields.hashRateSource,
    fetchedAt,
  });
}

export function createCalculationCacheKey(
  parameters: MiningParameters,
  market: MarketConditions,
  assumptions: CalculationAssumptions,
): string {
  const payload = JSON.stringify({ parameters, market, assumptions });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function getCachedCalculation<T>(
  key: string,
): Promise<CachedCalculationRecord<T> | null> {
  const cached = await calculationCacheRepository.getCalculationCache(key);
  if (!cached) {
    return null;
  }

  const expires = new Date(cached.expiresAt);
  if (!isCacheFresh(expires, CALCULATION_CACHE_TTL_SECONDS)) {
    return null;
  }

  return {
    key,
    result: cached.results as T,
    expiresAt: expires,
  };
}

export async function setCachedCalculation<T>(key: string, result: T): Promise<void> {
  const expiresAt = new Date(Date.now() + CALCULATION_CACHE_TTL_SECONDS * 1000);
  await calculationCacheRepository.upsertCalculationCache({
    parametersHash: key,
    results: result,
    expiresAt,
  });
}

export const CacheTTL = {
  MARKET_SECONDS: MARKET_CACHE_TTL_SECONDS,
  CALCULATION_SECONDS: CALCULATION_CACHE_TTL_SECONDS,
};
