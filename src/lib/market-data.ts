import { ExternalApiError, ValidationError } from "@/lib/errors";
import { retry } from "@/lib/retry";
import { MarketSnapshotSchema } from "@/lib/validations";
import type { CachedMarketData } from "@/lib/cache";
import type { MarketSnapshot } from "@/types/market";

const DATA_SOURCES = {
  btcPrice: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
  btcPriceCoinbase: "https://api.coinbase.com/v2/prices/BTC-USD/spot",
  btcPriceBinance: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
  networkStats: "https://blockchain.info/q/hashrate",
  difficulty: "https://blockchain.info/q/getdifficulty",
  minerstat: "https://api.minerstat.com/v2/coins?list=BTC",
} as const;

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
}

interface CoinbaseResponse {
  data?: {
    amount?: string;
  };
}

interface BinanceResponse {
  price?: string;
}

interface MinerstatResponseItem {
  coin: string;
  difficulty?: number;
  reward_block?: number;
}

interface MarketDataFetchOptions {
  fetcher?: typeof fetch;
  cache?: CachedMarketData | null;
}

interface MetricResult<T> {
  value: T;
  source: string;
}

interface NetworkMetricResult {
  networkHashRateEHS: number;
  difficulty: number;
  hashRateSource: string;
  difficultySource: string;
  blockReward: number;
}

export type MarketSnapshotSource = "live" | "cache";

const BLOCK_REWARD_BTC = 3.125;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const DIFFICULTY_TO_HASHRATE = 2 ** 32 / 600 / 1e18; // converts difficulty to EH/s

async function fetchJson<T>(
  url: string,
  fetcher: typeof fetch,
  headers: Record<string, string> = {},
): Promise<T> {
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    throw new ExternalApiError(`Failed request to ${url}`, response.status);
  }

  return response.json() as Promise<T>;
}

async function fetchText(url: string, fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(url, {
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new ExternalApiError(`Failed request to ${url}`, response.status);
  }

  return response.text();
}

async function fetchCoinGeckoPrice(fetcher: typeof fetch): Promise<MetricResult<number>> {
  const headers = COINGECKO_API_KEY ? { "x-cg-pro-api-key": COINGECKO_API_KEY } : {};
  const data = await fetchJson<CoinGeckoResponse>(DATA_SOURCES.btcPrice, fetcher, headers);
  const price = data.bitcoin?.usd;
  if (!price || Number.isNaN(price)) {
    throw new ValidationError("Invalid price data from CoinGecko", data);
  }
  return { value: price, source: "coingecko" };
}

async function fetchCoinbasePrice(fetcher: typeof fetch): Promise<MetricResult<number>> {
  const data = await fetchJson<CoinbaseResponse>(DATA_SOURCES.btcPriceCoinbase, fetcher);
  const amount = data.data?.amount ? Number.parseFloat(data.data.amount) : undefined;
  if (!amount || Number.isNaN(amount)) {
    throw new ValidationError("Invalid price data from Coinbase", data);
  }
  return { value: amount, source: "coinbase" };
}

async function fetchBinancePrice(fetcher: typeof fetch): Promise<MetricResult<number>> {
  const data = await fetchJson<BinanceResponse>(DATA_SOURCES.btcPriceBinance, fetcher);
  const price = data.price ? Number.parseFloat(data.price) : undefined;
  if (!price || Number.isNaN(price)) {
    throw new ValidationError("Invalid price data from Binance", data);
  }
  return { value: price, source: "binance" };
}

async function fetchBlockchainNetwork(fetcher: typeof fetch): Promise<NetworkMetricResult> {
  const [hashRateText, difficultyText] = await Promise.all([
    fetchText(DATA_SOURCES.networkStats, fetcher),
    fetchText(DATA_SOURCES.difficulty, fetcher),
  ]);

  const hashRateGh = Number.parseFloat(hashRateText);
  const difficulty = Number.parseFloat(difficultyText);

  if (Number.isNaN(hashRateGh) || hashRateGh <= 0) {
    throw new ValidationError("Invalid network hashrate", hashRateText);
  }

  if (Number.isNaN(difficulty) || difficulty <= 0) {
    throw new ValidationError("Invalid network difficulty", difficultyText);
  }

  const networkHashRateEHS = hashRateGh / 1_000_000_000; // blockchain.info returns GH/s

  return {
    networkHashRateEHS,
    difficulty,
    hashRateSource: "blockchain.info",
    difficultySource: "blockchain.info",
    blockReward: BLOCK_REWARD_BTC,
  };
}

async function fetchMinerstatNetwork(fetcher: typeof fetch): Promise<NetworkMetricResult> {
  const data = await fetchJson<MinerstatResponseItem[]>(DATA_SOURCES.minerstat, fetcher, {
    "Cache-Control": "no-cache",
  });
  const btc = Array.isArray(data) ? data.find((entry) => entry.coin === "BTC") : undefined;

  if (!btc || typeof btc.difficulty !== "number" || btc.difficulty <= 0) {
    throw new ValidationError("Invalid network data from Minerstat", data);
  }

  const difficulty = btc.difficulty;
  const networkHashRateEHS = difficulty * DIFFICULTY_TO_HASHRATE;
  const blockReward =
    typeof btc.reward_block === "number" && btc.reward_block > 0
      ? btc.reward_block
      : BLOCK_REWARD_BTC;

  return {
    networkHashRateEHS,
    difficulty,
    hashRateSource: "minerstat-derived",
    difficultySource: "minerstat",
    blockReward,
  };
}

async function fetchWithFallback<T>(
  providers: Array<() => Promise<MetricResult<T>>>,
  combine?: (results: MetricResult<T>[]) => MetricResult<T>,
): Promise<MetricResult<T>> {
  let lastError: unknown;
  const successful: MetricResult<T>[] = [];

  for (const provider of providers) {
    try {
      const result = await provider();
      successful.push(result);
      if (!combine) {
        return result;
      }
    } catch (error) {
      lastError = error;
      console.warn("Market data provider failed", error);
    }
  }

  if (combine && successful.length) {
    return combine(successful);
  }

  throw lastError ?? new Error("All market data providers failed");
}

async function fetchNetworkWithFallback(
  providers: Array<() => Promise<NetworkMetricResult>>,
): Promise<NetworkMetricResult> {
  let lastError: unknown;
  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      lastError = error;
      console.warn("Network data provider failed", error);
    }
  }
  throw lastError ?? new Error("All network data providers failed");
}

async function fetchFreshData(
  fetcher: typeof fetch,
): Promise<ReturnType<typeof MarketSnapshotSchema.parse>> {
  const price = await fetchWithFallback(
    [
      () => fetchCoinGeckoPrice(fetcher),
      () => fetchCoinbasePrice(fetcher),
      () => fetchBinancePrice(fetcher),
    ],
    (results) => ({
      value: average(results.map((entry) => entry.value)),
      source: results.map((entry) => entry.source).join(","),
    }),
  );

  const network = await fetchNetworkWithFallback([
    () => fetchBlockchainNetwork(fetcher),
    () => fetchMinerstatNetwork(fetcher),
  ]);

  return MarketSnapshotSchema.parse({
    btcPriceUSD: price.value,
    networkHashRateEHS: network.networkHashRateEHS,
    difficulty: network.difficulty,
    blockReward: network.blockReward,
    lastUpdated: new Date().toISOString(),
    priceSource: price.source,
    hashRateSource: network.hashRateSource,
  });
}

function mapCachedToSnapshot(cache: CachedMarketData): MarketSnapshot {
  return {
    btcPriceUSD: cache.btcPriceUSD,
    networkHashRateEHS: cache.networkHashRateEHS,
    difficulty: cache.difficulty,
    blockReward: cache.blockReward,
    lastUpdated: cache.fetchedAt.toISOString(),
    priceSource: cache.priceSource,
    hashRateSource: cache.hashRateSource,
  };
}

function average(values: number[]): number {
  if (!values.length) {
    throw new Error("Cannot average empty array");
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function fetchMarketSnapshot({
  fetcher = fetch,
  cache,
}: MarketDataFetchOptions = {}): Promise<{
  snapshot: MarketSnapshot;
  source: MarketSnapshotSource;
}> {
  return retry(
    async () => {
      const fresh = await fetchFreshData(fetcher);
      return { snapshot: fresh, source: "live" as const };
    },
    {
      attempts: 3,
      backoffMs: 500,
      jitter: 250,
      onRetry: (error) => {
        console.warn("Retrying market data fetch", error);
      },
    },
  ).catch((error) => {
    if (!cache) {
      throw error;
    }

    return {
      snapshot: mapCachedToSnapshot(cache),
      source: "cache" as const,
    };
  });
}
