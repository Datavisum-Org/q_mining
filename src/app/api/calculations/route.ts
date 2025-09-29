import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  CacheTTL,
  createCalculationCacheKey,
  getCachedCalculation,
  getCachedMarketData,
  setCachedCalculation,
} from "@/lib/cache";
import { miningCalculator } from "@/lib/calculations";
import { fetchMarketSnapshot } from "@/lib/market-data";
import { consumeRateLimit, rateLimitHeaders, toRateLimitMeta } from "@/lib/rate-limit";
import { MarketSnapshotSchema, MiningParametersSchema } from "@/lib/validations";
import type { CalculationApiResponse, CalculationResponseBody } from "@/types/api";
import type { MarketSnapshot } from "@/types/market";

const FALLBACK_MARKET: MarketSnapshot = {
  btcPriceUSD: 68_000,
  networkHashRateEHS: 520,
  difficulty: 83_000_000_000_000,
  blockReward: 3.125,
  lastUpdated: new Date().toISOString(),
  priceSource: "internal",
  hashRateSource: "internal",
};

const CalculationSchema = z.object({
  parameters: MiningParametersSchema,
  marketData: MarketSnapshotSchema.optional(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 60;

export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";
  const rateLimit = consumeRateLimit({
    key: "calculations",
    identifier,
    limit: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json<CalculationApiResponse>(
      {
        success: false,
        error: "Rate limit exceeded",
        rateLimit: toRateLimitMeta(rateLimit),
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(rateLimit),
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
    const { parameters, marketData } = CalculationSchema.parse(payload);

    const market = marketData ?? (await getLatestMarketSnapshot());
    const assumptions = miningCalculator.getAssumptions();
    const cacheKey = createCalculationCacheKey(parameters, market, assumptions);
    const cached = await getCachedCalculation<CalculationResponseBody["data"]>(cacheKey);
    if (cached) {
      return NextResponse.json<CalculationApiResponse>(
        {
          success: true,
          data: cached.result,
          metadata: {
            calculatedAt: new Date().toISOString(),
            marketDataAge: market.lastUpdated,
            cacheKey,
            cached: true,
            ttlSeconds: CacheTTL.CALCULATION_SECONDS,
          },
          rateLimit: toRateLimitMeta(rateLimit),
        },
        {
          status: 200,
          headers: {
            ...rateLimitHeaders(rateLimit),
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        },
      );
    }

    const results = miningCalculator.calculate(parameters, market, assumptions);

    await setCachedCalculation(cacheKey, results);

    return NextResponse.json<CalculationApiResponse>(
      {
        success: true,
        data: results,
        metadata: {
          calculatedAt: new Date().toISOString(),
          marketDataAge: market.lastUpdated,
          cacheKey,
          cached: false,
          ttlSeconds: CacheTTL.CALCULATION_SECONDS,
        },
        rateLimit: toRateLimitMeta(rateLimit),
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders(rateLimit),
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Calculation request failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<CalculationApiResponse>(
        {
          success: false,
          error: "Invalid input parameters",
          details: error.flatten(),
          rateLimit: toRateLimitMeta(rateLimit),
        },
        {
          status: 400,
          headers: rateLimitHeaders(rateLimit),
        },
      );
    }

    return NextResponse.json<CalculationApiResponse>(
      {
        success: false,
        error: "Unable to run calculations",
        details: error instanceof Error ? error.message : error,
        rateLimit: toRateLimitMeta(rateLimit),
      },
      {
        status: 500,
        headers: rateLimitHeaders(rateLimit),
      },
    );
  }
}

async function getLatestMarketSnapshot(): Promise<MarketSnapshot> {
  const cached = await getCachedMarketData();

  try {
    const { snapshot } = await fetchMarketSnapshot({ cache: cached ?? null });
    return snapshot;
  } catch (error) {
    console.warn("Falling back to internal market snapshot", error);

    if (cached) {
      return {
        btcPriceUSD: cached.btcPriceUSD,
        networkHashRateEHS: cached.networkHashRateEHS,
        difficulty: cached.difficulty,
        blockReward: cached.blockReward,
        lastUpdated: cached.fetchedAt.toISOString(),
        priceSource: cached.priceSource,
        hashRateSource: cached.hashRateSource,
      } satisfies MarketSnapshot;
    }

    return {
      ...FALLBACK_MARKET,
      lastUpdated: new Date().toISOString(),
    };
  }
}
