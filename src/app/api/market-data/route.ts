import { NextResponse } from "next/server";

import { CacheTTL, getCachedMarketData, isCacheFresh, setCachedMarketData } from "@/lib/cache";
import { ExternalApiError, ValidationError } from "@/lib/errors";
import { fetchMarketSnapshot } from "@/lib/market-data";
import { consumeRateLimit, rateLimitHeaders, toRateLimitMeta } from "@/lib/rate-limit";
import type { MarketDataResponse } from "@/types/api";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 30;

export async function GET(request: Request) {
  const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";
  const rateLimit = consumeRateLimit({
    key: "market-data",
    identifier,
    limit: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json<MarketDataResponse>(
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
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const cached = await getCachedMarketData();
  if (cached && isCacheFresh(cached.fetchedAt, CacheTTL.MARKET_SECONDS)) {
    return NextResponse.json<MarketDataResponse>(
      {
        success: true,
        data: {
          btcPriceUSD: cached.btcPriceUSD,
          networkHashRateEHS: cached.networkHashRateEHS,
          difficulty: cached.difficulty,
          blockReward: cached.blockReward,
          lastUpdated: cached.fetchedAt.toISOString(),
          priceSource: cached.priceSource,
          hashRateSource: cached.hashRateSource,
        },
        metadata: {
          cachedAt: cached.fetchedAt.toISOString(),
          ttlSeconds: CacheTTL.MARKET_SECONDS,
          sourcePriority: "cache",
        },
        rateLimit: toRateLimitMeta(rateLimit),
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders(rateLimit),
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  }

  try {
    const { snapshot, source } = await fetchMarketSnapshot({ cache: cached });

    await setCachedMarketData({
      btcPriceUSD: snapshot.btcPriceUSD,
      networkHashRateEHS: snapshot.networkHashRateEHS,
      difficulty: snapshot.difficulty,
      blockReward: snapshot.blockReward,
      priceSource: snapshot.priceSource,
      hashRateSource: snapshot.hashRateSource,
      fetchedAt: new Date(snapshot.lastUpdated),
    });

    return NextResponse.json<MarketDataResponse>(
      {
        success: true,
        data: snapshot,
        metadata: {
          cachedAt: snapshot.lastUpdated,
          ttlSeconds: CacheTTL.MARKET_SECONDS,
          sourcePriority: source,
        },
        rateLimit: toRateLimitMeta(rateLimit),
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders(rateLimit),
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch market data", error);

    const payload: MarketDataResponse = {
      success: false,
      error: error instanceof ValidationError ? error.message : "Failed to load market data",
      details: error instanceof ValidationError ? error.payload : undefined,
      rateLimit: toRateLimitMeta(rateLimit),
    };

    const status = error instanceof ExternalApiError ? (error.status ?? 502) : 500;
    const retryAfter =
      error instanceof ExternalApiError && error.retryAfterSeconds
        ? String(error.retryAfterSeconds)
        : undefined;

    return NextResponse.json(payload, {
      status,
      headers: {
        ...rateLimitHeaders(rateLimit),
        ...(retryAfter ? { "Retry-After": retryAfter } : {}),
        "Cache-Control": "no-store",
      },
    });
  }
}
