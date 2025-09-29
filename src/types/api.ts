import type {
  CalculationResults,
  MiningParameters,
  ScenarioComparisonResult,
  ScenarioVariation,
} from "@/types/mining";
import type { MarketSnapshot } from "@/types/market";

export interface CalculationRequestBody {
  parameters: MiningParameters;
  marketData?: MarketSnapshot;
}

export interface CalculationResponseBody {
  success: true;
  data: CalculationResults;
  metadata: {
    calculatedAt: string;
    marketDataAge: string;
    cacheKey?: string;
    cached?: boolean;
    ttlSeconds: number;
  };
  rateLimit?: RateLimitMeta;
}

export interface CalculationErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  rateLimit?: RateLimitMeta;
}

export type CalculationApiResponse = CalculationResponseBody | CalculationErrorResponse;

export interface ScenarioComparisonRequest {
  base: MiningParameters;
  scenarios: ScenarioVariation[];
  market: MarketSnapshot;
}

export interface ScenarioComparisonResponse {
  success: boolean;
  data: ScenarioComparisonResult[];
  metadata: {
    comparedAt: string;
    baseScenario: string;
  };
}

export interface OperationRecord extends MiningParameters {
  id: string;
  name: string;
  hardwareType?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketDataSuccessResponse {
  success: true;
  data: MarketSnapshot;
  metadata: {
    cachedAt: string;
    ttlSeconds: number;
    sourcePriority: string;
  };
  rateLimit?: RateLimitMeta;
}

export interface MarketDataErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  rateLimit?: RateLimitMeta;
}

export type MarketDataResponse = MarketDataSuccessResponse | MarketDataErrorResponse;

export interface RateLimitMeta {
  limit: number;
  remaining: number;
  resetAt: string;
}
