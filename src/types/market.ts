export interface MarketSnapshot {
  btcPriceUSD: number;
  networkHashRateEHS: number;
  difficulty: number;
  blockReward: number;
  lastUpdated: string;
  priceSource: string;
  hashRateSource: string;
}
