import useSWR from "swr";
import type { MarketSnapshot } from "@/types/market";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

interface MarketResponse {
  data: MarketSnapshot;
}

export function useMarketData() {
  const { data, error, isLoading, mutate } = useSWR<MarketResponse>("/api/market-data", fetcher, {
    refreshInterval: 60_000,
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
  });

  return {
    marketData: data?.data,
    isLoading,
    error,
    refresh: mutate,
  };
}
