import type { CalculationResults, MiningParameters } from "@/types/mining";
import type { MarketSnapshot } from "@/types/market";
import { safeDivide, toFixed } from "@/lib/utils";

const BLOCKS_PER_DAY = 144;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const DEFAULT_NETWORK_GROWTH = 0.02; // 2% monthly network growth assumption
const DISCOUNT_RATE = 0.1; // 10% annual discount rate for NPV

export class MiningCalculator {
  calculate(parameters: MiningParameters, market: MarketSnapshot): CalculationResults {
    const hashRateShare = safeDivide(parameters.hashRate, market.networkHashRateEHS);
    const btcPerDay = toFixed(hashRateShare * BLOCKS_PER_DAY * market.blockReward, 8);
    const usdPerDay = toFixed(btcPerDay * market.btcPriceUSD, 2);
    const usdPerMonth = toFixed(usdPerDay * DAYS_PER_MONTH, 2);
    const usdPerYear = toFixed(usdPerDay * DAYS_PER_YEAR, 2);

    const electricityPerDay = toFixed(
      parameters.powerConsumption * 1000 * 24 * parameters.electricityRate,
      2,
    );
    const electricityPerMonth = toFixed(electricityPerDay * DAYS_PER_MONTH, 2);
    const maintenancePerMonth = toFixed(parameters.maintenanceCost ?? 0, 2);
    const totalOperatingPerMonth = toFixed(electricityPerMonth + maintenancePerMonth, 2);

    const grossProfitPerDay = toFixed(usdPerDay - electricityPerDay, 2);
    const grossProfitPerMonth = toFixed(usdPerMonth - electricityPerMonth, 2);
    const netProfitPerMonth = toFixed(grossProfitPerMonth - maintenancePerMonth, 2);

    const totalInitialInvestment = toFixed(
      (parameters.hardwareCost ?? 0) + (parameters.setupCost ?? 0),
      2,
    );
    const profitMarginPercent = toFixed(safeDivide(netProfitPerMonth, usdPerMonth || 1), 4);

    const breakEvenBtcPrice = toFixed(
      safeDivide(
        totalOperatingPerMonth,
        hashRateShare * BLOCKS_PER_DAY * market.blockReward * DAYS_PER_MONTH,
      ),
      2,
    );

    const monthlyROI = toFixed(safeDivide(netProfitPerMonth, totalInitialInvestment || 1), 4);
    const annualROI = toFixed(monthlyROI * 12, 4);
    const paybackPeriodMonths =
      netProfitPerMonth > 0 ? toFixed(safeDivide(totalInitialInvestment, netProfitPerMonth), 2) : 0;

    const projectedMonthly = this.generateProjection(netProfitPerMonth, 12, DEFAULT_NETWORK_GROWTH);
    const npv12Months = toFixed(
      this.calculateNPV(projectedMonthly, totalInitialInvestment, DISCOUNT_RATE),
      2,
    );

    return {
      revenue: {
        btcPerDay,
        usdPerDay,
        usdPerMonth,
        usdPerYear,
        projectedMonthly,
      },
      costs: {
        electricityPerDay,
        electricityPerMonth,
        maintenancePerMonth,
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
    };
  }

  private generateProjection(
    baseValue: number,
    months: number,
    monthlyGrowthRate: number,
  ): number[] {
    const projection: number[] = [];
    let currentValue = baseValue;

    for (let index = 0; index < months; index += 1) {
      projection.push(toFixed(currentValue, 2));
      currentValue = currentValue / (1 + monthlyGrowthRate);
    }

    return projection;
  }

  private calculateNPV(
    cashFlows: number[],
    initialInvestment: number,
    annualDiscountRate: number,
  ): number {
    const monthlyDiscountRate = annualDiscountRate / 12;
    let npv = -initialInvestment;

    cashFlows.forEach((cashFlow, index) => {
      npv += cashFlow / Math.pow(1 + monthlyDiscountRate, index + 1);
    });

    return npv;
  }
}

export const miningCalculator = new MiningCalculator();
