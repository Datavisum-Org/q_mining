import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";

import { MiningCalculator } from "@/lib/calculations";
import { DEFAULT_DISCOUNT_RATE, DEFAULT_NETWORK_GROWTH_RATE } from "@/lib/constants";
import { npv, roundTo, safeDivide } from "@/utils/math";
import type { MarketConditions, MiningParameters } from "@/types/mining";

const BASE_PARAMETERS: MiningParameters = {
  hashRate: 0.1,
  powerConsumption: 3.25,
  electricityRate: 0.05,
  hardwareCost: 650_000,
  setupCost: 50_000,
  maintenanceCost: 5_000,
};

const BASE_MARKET: MarketConditions = {
  btcPriceUSD: 50_000,
  networkHashRateEHS: 350,
  difficulty: 50_000_000_000_000,
  blockReward: 3.125,
};

describe("MiningCalculator", () => {
  const calculator = new MiningCalculator();

  it("calculates standard profitable scenario", () => {
    const results = calculator.calculate(BASE_PARAMETERS, BASE_MARKET);

    expect(results.revenue.btcPerDay).toBeCloseTo(0.12857143, 6);
    expect(results.revenue.usdPerDay).toBeCloseTo(6428.57, 2);
    expect(results.revenue.usdPerMonth).toBeCloseTo(192_857.14, 2);

    expect(results.costs.electricityPerDay).toBeCloseTo(3900, 2);
    expect(results.costs.totalOperatingPerMonth).toBeCloseTo(140_055.56, 2);

    expect(results.profitability.netProfitPerMonth).toBeCloseTo(52_801.58, 2);
    expect(results.profitability.profitMarginPercent).toBeCloseTo(0.2738, 4);
    expect(results.profitability.breakEvenBtcPrice).toBeCloseTo(36_310.7, 1);

    expect(results.investment.totalInitialInvestment).toBeCloseTo(700_000, 2);
    expect(results.investment.monthlyROI).toBeCloseTo(0.0754, 4);
    expect(results.investment.annualROI).toBeCloseTo(0.9048, 4);
    expect(results.investment.paybackPeriodMonths).toBeCloseTo(13.26, 2);

    expect(results.revenue.projectedMonthly).toHaveLength(12);
    expect(results.revenue.projectedMonthly[0]).toBeCloseTo(
      results.profitability.netProfitPerMonth,
      2,
    );

    const expectedSecondMonth = roundTo(
      results.profitability.netProfitPerMonth / (1 + DEFAULT_NETWORK_GROWTH_RATE),
      2,
    );
    expect(results.revenue.projectedMonthly[1]).toBeCloseTo(expectedSecondMonth, 2);
  });

  it("returns near break-even when electricity rate is adjusted", () => {
    const baseline = calculator.calculate(BASE_PARAMETERS, BASE_MARKET);
    const monthlyRevenue = baseline.revenue.usdPerMonth;
    const nonElectricityCosts =
      baseline.costs.maintenancePerMonth + baseline.costs.depreciationPerMonth;
    const requiredElectricityCost = monthlyRevenue - nonElectricityCosts;

    const hoursPerMonth = 24 * 30;
    const denominator = BASE_PARAMETERS.powerConsumption * 1_000 * hoursPerMonth;
    const targetRate = requiredElectricityCost / denominator;

    const breakEvenParameters: MiningParameters = {
      ...BASE_PARAMETERS,
      electricityRate: roundTo(targetRate, 6),
    };

    const results = calculator.calculate(breakEvenParameters, BASE_MARKET);
    expect(Math.abs(results.profitability.netProfitPerMonth)).toBeLessThan(1);
    expect(results.investment.paybackPeriodMonths).toBeNull();
  });

  it("handles unprofitable scenarios with negative net profit", () => {
    const expensiveElectricity: MiningParameters = {
      ...BASE_PARAMETERS,
      electricityRate: 0.12,
    };

    const results = calculator.calculate(expensiveElectricity, BASE_MARKET);
    expect(results.profitability.netProfitPerMonth).toBeLessThan(0);
    expect(results.investment.paybackPeriodMonths).toBeNull();
    expect(results.investment.annualROI).toBeLessThan(0);
  });

  it("handles zero hash rate gracefully", () => {
    const zeroHash: MiningParameters = {
      ...BASE_PARAMETERS,
      hashRate: 0,
    };

    const results = calculator.calculate(zeroHash, BASE_MARKET);
    expect(results.revenue.usdPerDay).toBe(0);
    expect(results.profitability.netProfitPerMonth).toBeLessThan(0);
    expect(results.profitability.breakEvenBtcPrice).toBe(0);
  });

  it("computes NPV in line with manual calculation", () => {
    const results = calculator.calculate(BASE_PARAMETERS, BASE_MARKET);

    const manualNpv = npv(
      results.projection.monthly,
      DEFAULT_DISCOUNT_RATE,
      results.investment.totalInitialInvestment,
    );

    expect(results.investment.npv12Months).toBeCloseTo(roundTo(manualNpv, 2), 2);
  });

  it("supports overriding assumptions per calculation", () => {
    const zeroGrowth = calculator.calculate(BASE_PARAMETERS, BASE_MARKET, {
      networkGrowthMonthly: 0,
      projectionMonths: 6,
    });

    expect(zeroGrowth.revenue.projectedMonthly).toHaveLength(6);
    expect(new Set(zeroGrowth.revenue.projectedMonthly).size).toBe(1);
  });

  it("validates unrealistic inputs", () => {
    expect(() =>
      calculator.calculate(
        {
          ...BASE_PARAMETERS,
          maintenanceCost: -1,
        },
        BASE_MARKET,
      ),
    ).toThrow(ZodError);
  });
});

describe("math utilities", () => {
  it("uses fallback for safe divide when denominator is zero", () => {
    expect(safeDivide(100, 0, 42)).toBe(42);
  });

  it("returns zero when rounding non-finite numbers", () => {
    expect(roundTo(Number.POSITIVE_INFINITY, 2)).toBe(0);
  });

  it("supports rounding precision when dividing", () => {
    expect(safeDivide(5, 2, 0, 2)).toBeCloseTo(2.5, 2);
  });

  it("returns raw division result when decimals are not provided", () => {
    expect(safeDivide(9, 3)).toBe(3);
  });
});
