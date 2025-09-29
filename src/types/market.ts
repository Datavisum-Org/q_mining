export interface MarketSnapshot {
  btcPriceUSD: number;
  networkHashRateEHS: number;
  difficulty: number;
  blockReward: number;
  lastUpdated: string;
  priceSource?: string;
  hashRateSource?: string;
}

export interface MarketDataResponse {
  data: MarketSnapshot;
  cachedAt: string;
}
