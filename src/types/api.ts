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
  success: boolean;
  data: CalculationResults;
  metadata: {
    calculatedAt: string;
    marketDataAge: string;
  };
}

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
