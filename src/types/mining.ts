export interface MiningParameters {
  hashRate: number; // EH/s
  powerConsumption: number; // MW
  electricityRate: number; // USD/kWh
  hardwareCost: number; // USD
  setupCost?: number; // USD
  maintenanceCost?: number; // USD/month
}

export interface CostBreakdown {
  electricityPerDay: number;
  electricityPerMonth: number;
  maintenancePerMonth: number;
  totalOperatingPerMonth: number;
}

export interface RevenueBreakdown {
  btcPerDay: number;
  usdPerDay: number;
  usdPerMonth: number;
  usdPerYear: number;
  projectedMonthly: number[];
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
  paybackPeriodMonths: number;
  npv12Months: number;
}

export interface CalculationResults {
  revenue: RevenueBreakdown;
  costs: CostBreakdown;
  profitability: ProfitabilityMetrics;
  investment: InvestmentMetrics;
}

export interface ScenarioVariation {
  name: string;
  btcPriceMultiplier: number;
  networkGrowthRate: number;
  electricityRateMultiplier: number;
}

export interface ScenarioComparisonResult {
  scenario: string;
  netProfitPerMonth: number;
  paybackPeriodMonths: number;
  annualROI: number;
}
