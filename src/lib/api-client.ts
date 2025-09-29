import type { CalculationRequestBody, CalculationResponseBody } from "@/types/api";
import type { MarketSnapshot } from "@/types/market";

async function getBaseUrl(): Promise<string> {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}${input}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request to ${input} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const data = await fetchJson<{ data: MarketSnapshot }>("/api/market-data");
  return data.data;
}

export async function calculateProfitability(
  payload: CalculationRequestBody,
): Promise<CalculationResponseBody> {
  return fetchJson<CalculationResponseBody>("/api/calculations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
