import useSWR from "swr";
import type { CalculationRequestBody, CalculationResponseBody } from "@/types/api";
import type { MiningParameters } from "@/types/mining";
import type { MarketSnapshot } from "@/types/market";

interface UseCalculationsArgs {
  parameters?: MiningParameters;
  marketData?: MarketSnapshot;
}

export function useCalculations({ parameters, marketData }: UseCalculationsArgs) {
  const key = parameters ? ["calculations", parameters, marketData] : null;

  const swr = useSWR<CalculationResponseBody>(
    key,
    async () => {
      if (!parameters) {
        throw new Error("Missing mining parameters");
      }

      const payload: CalculationRequestBody = marketData
        ? { parameters, marketData }
        : { parameters };

      const response = await fetch("/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadText = await response.text();
        throw new Error(`Failed to compute profitability (${response.status}): ${payloadText}`);
      }

      const body: CalculationResponseBody = await response.json();
      if (!body.success) {
        throw new Error("Calculation service responded with an error");
      }

      return body;
    },
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
    },
  );

  return {
    results: swr.data,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}
