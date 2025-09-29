import { fetchMarketSnapshot } from "@/lib/market-data";
import type { CachedMarketData } from "@/lib/cache";

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const textResponse = (text: string, status = 200): Response =>
  new Response(text, {
    status,
    headers: { "Content-Type": "text/plain" },
  });

describe("fetchMarketSnapshot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns live snapshot when primary providers succeed", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const fetchMock = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("coingecko")) {
        return jsonResponse({ bitcoin: { usd: 50_000 } });
      }
      if (url.includes("coinbase")) {
        return jsonResponse({ data: { amount: "51000" } });
      }
      if (url.includes("binance")) {
        return jsonResponse({ price: "49000" });
      }
      if (url.includes("hashrate")) {
        return textResponse("350000000000");
      }
      if (url.includes("getdifficulty")) {
        return textResponse("8.3e13");
      }
      if (url.includes("minerstat")) {
        return jsonResponse([{ coin: "BTC", difficulty: 8.2e13, reward_block: 3.125 }]);
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    }) as typeof fetch;

    const { snapshot, source } = await fetchMarketSnapshot({ fetcher: fetchMock });

    expect(source).toBe("live");
    expect(snapshot.btcPriceUSD).toBeCloseTo(50_000, 5);
    expect(snapshot.priceSource).toBe("coingecko,coinbase,binance");
    expect(snapshot.hashRateSource).toBe("blockchain.info");
    expect(snapshot.blockReward).toBeCloseTo(3.125, 5);

    warnSpy.mockRestore();
  });

  it("falls back to cached snapshot when all providers fail", async () => {
    const fetchedAt = new Date("2024-01-01T00:00:00Z");
    const cached: CachedMarketData = {
      id: "cached-market",
      btcPriceUSD: 47_500,
      networkHashRateEHS: 320,
      difficulty: 8.1e13,
      blockReward: 3.125,
      priceSource: "cache-source",
      hashRateSource: "cache-hash",
      fetchedAt,
    };

    const failingFetch = (async () => textResponse("error", 500)) as typeof fetch;

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const { snapshot, source } = await fetchMarketSnapshot({
      fetcher: failingFetch,
      cache: cached,
    });

    expect(source).toBe("cache");
    expect(snapshot).toEqual({
      btcPriceUSD: cached.btcPriceUSD,
      networkHashRateEHS: cached.networkHashRateEHS,
      difficulty: cached.difficulty,
      blockReward: cached.blockReward,
      lastUpdated: fetchedAt.toISOString(),
      priceSource: cached.priceSource,
      hashRateSource: cached.hashRateSource,
    });

    warnSpy.mockRestore();
  });

  it("uses secondary network provider when primary fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const fetchMock = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("coingecko")) {
        return jsonResponse({ bitcoin: { usd: 52_000 } });
      }
      if (url.includes("coinbase")) {
        return jsonResponse({ data: { amount: "51500" } });
      }
      if (url.includes("binance")) {
        return jsonResponse({ price: "51000" });
      }
      if (url.includes("hashrate")) {
        return textResponse("unavailable", 500);
      }
      if (url.includes("getdifficulty")) {
        return textResponse("8.4e13");
      }
      if (url.includes("minerstat")) {
        return jsonResponse([{ coin: "BTC", difficulty: 8.4e13, reward_block: 3.2 }]);
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    }) as typeof fetch;

    const { snapshot, source } = await fetchMarketSnapshot({ fetcher: fetchMock });

    expect(source).toBe("live");
    expect(snapshot.hashRateSource).toBe("minerstat-derived");
    expect(snapshot.blockReward).toBeCloseTo(3.2, 5);
    expect(snapshot.priceSource).toBe("coingecko,coinbase,binance");

    warnSpy.mockRestore();
  });
});
