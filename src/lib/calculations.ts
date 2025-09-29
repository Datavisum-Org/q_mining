import {
  BLOCKS_PER_DAY,
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  DEFAULT_DEPRECIATION_MONTHS,
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_NETWORK_GROWTH_RATE,
  HOURS_PER_DAY,
  KILOWATTS_PER_MEGAWATT,
  PROJECTION_MONTHS,
} from "@/lib/constants";
import {
  CalculationAssumptionsSchema,
  MarketConditionsSchema,
  MiningParametersSchema,
} from "@/lib/validations";
import type {
  CalculationAssumptions,
  CalculationResults,
  MarketConditions,
  MiningParameters,
} from "@/types/mining";
import { cumulative, npv, roundTo, safeDivide } from "@/utils/math";

export interface MiningCalculatorOptions {
  assumptions?: Partial<CalculationAssumptions>;
}

const DEFAULT_ASSUMPTIONS: CalculationAssumptions = {
  networkGrowthMonthly: DEFAULT_NETWORK_GROWTH_RATE,
  discountRateAnnual: DEFAULT_DISCOUNT_RATE,
  depreciationMonths: DEFAULT_DEPRECIATION_MONTHS,
  projectionMonths: PROJECTION_MONTHS,
};

export class MiningCalculator {
  private readonly baseAssumptions: CalculationAssumptions;

  constructor(options: MiningCalculatorOptions = {}) {
    const assumed = CalculationAssumptionsSchema.parse({
      ...DEFAULT_ASSUMPTIONS,
      ...(options.assumptions ?? {}),
    });

    this.baseAssumptions = assumed;
  }

  getAssumptions(overrides?: Partial<CalculationAssumptions>): CalculationAssumptions {
    return CalculationAssumptionsSchema.parse({
      ...this.baseAssumptions,
      ...(overrides ?? {}),
    });
  }

  calculate(
    parameters: MiningParameters,
    market: MarketConditions,
    overrides?: Partial<CalculationAssumptions>,
  ): CalculationResults {
    const validatedParameters = MiningParametersSchema.parse(parameters);
    const validatedMarket = MarketConditionsSchema.parse(market);
    const mergedAssumptions = this.getAssumptions(overrides);

    const shareOfNetwork = safeDivide(
      validatedParameters.hashRate,
      validatedMarket.networkHashRateEHS,
      0,
    );

    const btcPerDayRaw = shareOfNetwork * BLOCKS_PER_DAY * validatedMarket.blockReward;
    const usdPerDayRaw = btcPerDayRaw * validatedMarket.btcPriceUSD;

    const btcPerDay = roundTo(btcPerDayRaw, 8);
    const usdPerDay = roundTo(usdPerDayRaw, 2);
    const usdPerMonth = roundTo(usdPerDayRaw * DAYS_PER_MONTH, 2);
    const usdPerYear = roundTo(usdPerDayRaw * DAYS_PER_YEAR, 2);

    const electricityPerDay = roundTo(
      validatedParameters.powerConsumption *
        KILOWATTS_PER_MEGAWATT *
        HOURS_PER_DAY *
        validatedParameters.electricityRate,
      2,
    );
    const electricityPerMonth = roundTo(electricityPerDay * DAYS_PER_MONTH, 2);
    const maintenancePerMonth = roundTo(validatedParameters.maintenanceCost, 2);
    const depreciationPerMonth = roundTo(
      safeDivide(validatedParameters.hardwareCost, mergedAssumptions.depreciationMonths, 0),
      2,
    );
    const totalOperatingPerMonth = roundTo(
      electricityPerMonth + maintenancePerMonth + depreciationPerMonth,
      2,
    );

    const grossProfitPerDay = roundTo(usdPerDay - electricityPerDay, 2);
    const grossProfitPerMonth = roundTo(usdPerMonth - electricityPerMonth, 2);
    const netProfitPerMonth = roundTo(
      grossProfitPerMonth - maintenancePerMonth - depreciationPerMonth,
      2,
    );
    const profitMarginPercent = safeDivide(netProfitPerMonth, usdPerMonth, 0, 4);

    const monthlyBtc = roundTo(btcPerDayRaw * DAYS_PER_MONTH, 8);
    const breakEvenBtcPrice =
      monthlyBtc > 0 ? roundTo(safeDivide(totalOperatingPerMonth, monthlyBtc, 0), 2) : 0;

    const totalInitialInvestment = roundTo(
      validatedParameters.hardwareCost + validatedParameters.setupCost,
      2,
    );
    const monthlyROI = safeDivide(netProfitPerMonth, totalInitialInvestment, 0, 4);
    const annualROI = roundTo(monthlyROI * 12, 4);
    const paybackPeriodMonths =
      netProfitPerMonth > 0 ? roundTo(totalInitialInvestment / netProfitPerMonth, 2) : null;

    const projectionMonthly = this.generateProjection(
      netProfitPerMonth,
      mergedAssumptions.projectionMonths,
      mergedAssumptions.networkGrowthMonthly,
    );
    const projectionCumulative = cumulative(projectionMonthly).map((value) => roundTo(value, 2));

    const npv12Months = roundTo(
      npv(projectionMonthly, mergedAssumptions.discountRateAnnual, totalInitialInvestment),
      2,
    );

    return {
      assumptions: mergedAssumptions,
      revenue: {
        btcPerDay,
        usdPerDay,
        usdPerMonth,
        usdPerYear,
        projectedMonthly: projectionMonthly,
      },
      costs: {
        electricityPerDay,
        electricityPerMonth,
        maintenancePerMonth,
        depreciationPerMonth,
        totalOperatingPerMonth,
      },
      profitability: {
        grossProfitPerDay,
        grossProfitPerMonth,
        netProfitPerMonth,
        profitMarginPercent,
        breakEvenBtcPrice,
      },
      investment: {
        totalInitialInvestment,
        monthlyROI,
        annualROI,
        paybackPeriodMonths,
        npv12Months,
      },
      projection: {
        monthly: projectionMonthly,
        cumulative: projectionCumulative,
      },
    };
  }

  private generateProjection(
    baseValue: number,
    months: number,
    monthlyGrowthRate: number,
  ): number[] {
    const projection: number[] = [];
    let current = baseValue;

    for (let index = 0; index < months; index += 1) {
      projection.push(roundTo(current, 2));
      current = safeDivide(current, 1 + monthlyGrowthRate, current);
    }

    return projection;
  }
}

export const miningCalculator = new MiningCalculator();
