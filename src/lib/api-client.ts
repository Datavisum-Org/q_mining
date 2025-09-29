import { APIError, ExternalApiError } from "@/lib/errors";
import type {
  CalculationApiResponse,
  CalculationRequestBody,
  CalculationResponseBody,
  MarketDataResponse,
} from "@/types/api";
import type { MarketSnapshot } from "@/types/market";

async function getBaseUrl(): Promise<string> {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
    const retryAfter = response.headers.get("Retry-After");
    const payload = await response.json().catch(() => undefined);
    throw new ExternalApiError(
      `Request to ${input} failed with status ${response.status}`,
      response.status,
      retryAfter ? Number.parseInt(retryAfter, 10) || undefined : undefined,
      payload,
    );
  }

  return response.json() as Promise<T>;
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const response = await fetchJson<MarketDataResponse>("/api/market-data");
  if (!response.success) {
    throw new APIError(response.error);
  }
  return response.data;
}

export async function calculateProfitability(
  payload: CalculationRequestBody,
): Promise<CalculationResponseBody> {
  const response = await fetchJson<CalculationApiResponse>("/api/calculations", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.success) {
    throw new APIError(response.error, undefined, response.details, response.rateLimit);
  }

  return response;
}
