import useSWR from "swr";
import type { MarketDataResponse } from "@/types/api";
import type { MarketSnapshot } from "@/types/market";

async function fetchMarketData(): Promise<MarketSnapshot> {
  const response = await fetch("/api/market-data");
  if (!response.ok) {
    throw new Error(`Failed to fetch market data (${response.status})`);
  }

  const payload: MarketDataResponse = await response.json();
  if (!payload.success) {
    throw new Error(payload.error);
  }

  return payload.data;
}

export function useMarketData() {
  const { data, error, isLoading, mutate } = useSWR<MarketSnapshot>(
    "market-data",
    fetchMarketData,
    {
      refreshInterval: 60_000,
      dedupingInterval: 10_000,
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5_000,
    },
  );

  return {
    marketData: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
