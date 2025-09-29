export interface MiningParameters {
  hashRate: number; // EH/s
  powerConsumption: number; // MW
  electricityRate: number; // USD per kWh
  hardwareCost: number; // USD
  setupCost: number; // USD
  maintenanceCost: number; // USD per month
}

export interface MarketConditions {
  btcPriceUSD: number;
  networkHashRateEHS: number;
  difficulty: number;
  blockReward: number; // BTC
}

export interface CalculationAssumptions {
  networkGrowthMonthly: number;
  discountRateAnnual: number;
  depreciationMonths: number;
  projectionMonths: number;
}

export interface RevenueBreakdown {
  btcPerDay: number;
  usdPerDay: number;
  usdPerMonth: number;
  usdPerYear: number;
  projectedMonthly: number[];
}

export interface CostBreakdown {
  electricityPerDay: number;
  electricityPerMonth: number;
  maintenancePerMonth: number;
  depreciationPerMonth: number;
  totalOperatingPerMonth: number;
}

export interface ProfitabilityMetrics {
  grossProfitPerDay: number;
  grossProfitPerMonth: number;
  netProfitPerMonth: number;
  profitMarginPercent: number;
  breakEvenBtcPrice: number;
}

export interface InvestmentMetrics {
  totalInitialInvestment: number;
  monthlyROI: number;
  annualROI: number;
  paybackPeriodMonths: number | null;
  npv12Months: number;
}

export interface ProjectionSummary {
  monthly: number[];
  cumulative: number[];
}

export interface ScenarioComparisonResult {
  scenario: string;
  netProfitPerMonth: number;
  paybackPeriodMonths: number | null;
  annualROI: number;
}

export interface ScenarioVariation {
  name: string;
  btcPriceMultiplier: number;
  networkGrowthRate: number;
  electricityRateMultiplier: number;
}

export interface CalculationResults {
  assumptions: CalculationAssumptions;
  revenue: RevenueBreakdown;
  costs: CostBreakdown;
  profitability: ProfitabilityMetrics;
  investment: InvestmentMetrics;
  projection: ProjectionSummary;
}
