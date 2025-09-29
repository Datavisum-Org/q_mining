"use client";

import { useMemo, useState } from "react";
import { ParameterForm } from "@/components/calculator/ParameterForm";
import { ResultsDisplay } from "@/components/calculator/ResultsDisplay";
import { ScenarioComparison } from "@/components/calculator/ScenarioComparison";
import { BreakEvenChart } from "@/components/charts/BreakEvenChart";
import { CostBreakdownChart } from "@/components/charts/CostBreakdownChart";
import { ProfitabilityChart } from "@/components/charts/ProfitabilityChart";
import { Card } from "@/components/ui";
import { useCalculations } from "@/hooks/useCalculations";
import { useMarketData } from "@/hooks/useMarketData";
import { miningCalculator } from "@/lib/calculations";
import type { MiningParameters, ScenarioComparisonResult } from "@/types/mining";

const DEFAULT_PARAMETERS: MiningParameters = {
  hashRate: 0.1,
  powerConsumption: 3.25,
  electricityRate: 0.06,
  hardwareCost: 650_000,
  setupCost: 50_000,
  maintenanceCost: 5_000,
};

const SCENARIO_PRESETS = [
  {
    name: "Optimistic",
    btcPriceMultiplier: 1.25,
    networkGrowthRate: 0.0,
    electricityRateMultiplier: 0.95,
  },
  {
    name: "Base Case",
    btcPriceMultiplier: 1,
    networkGrowthRate: 0.02,
    electricityRateMultiplier: 1,
  },
  {
    name: "Stress",
    btcPriceMultiplier: 0.75,
    networkGrowthRate: 0.05,
    electricityRateMultiplier: 1.15,
  },
];

export default function CalculatorPage() {
  const { marketData, isLoading: marketLoading } = useMarketData();
  const [parameters, setParameters] = useState<MiningParameters>(DEFAULT_PARAMETERS);
  const [submittedParameters, setSubmittedParameters] =
    useState<MiningParameters>(DEFAULT_PARAMETERS);

  const { results: calculationResponse, isLoading: calculationsLoading } = useCalculations({
    parameters: submittedParameters,
    ...(marketData ? { marketData } : {}),
  });

  const isLoading = marketLoading || calculationsLoading;

  const calculation = calculationResponse?.data;
  const projectedSeries = useMemo(() => calculation?.revenue.projectedMonthly ?? [], [calculation]);

  const scenarios: ScenarioComparisonResult[] | undefined = useMemo(() => {
    if (!marketData || !calculation) {
      return undefined;
    }

    return SCENARIO_PRESETS.map((scenario) => {
      const adjustedMarket = {
        ...marketData,
        btcPriceUSD: marketData.btcPriceUSD * scenario.btcPriceMultiplier,
        networkHashRateEHS: marketData.networkHashRateEHS * (1 + scenario.networkGrowthRate),
      };

      const adjustedParameters: MiningParameters = {
        ...submittedParameters,
        electricityRate: submittedParameters.electricityRate * scenario.electricityRateMultiplier,
      };

      const result = miningCalculator.calculate(adjustedParameters, adjustedMarket);

      return {
        scenario: scenario.name,
        netProfitPerMonth: result.profitability.netProfitPerMonth,
        paybackPeriodMonths: result.investment.paybackPeriodMonths,
        annualROI: result.investment.annualROI,
      } satisfies ScenarioComparisonResult;
    });
  }, [calculation, marketData, submittedParameters]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-slate-100">Mining Profitability Calculator</h1>
        <p className="text-ore-300">
          Configure your operation inputs, plug in live market data, and capture the economics of a
          Bitcoin mining deployment in seconds.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card title="Mining Parameters" subtitle="Hardware, power, and cost assumptions">
          <ParameterForm
            initialValues={parameters}
            onChange={setParameters}
            onSubmit={(values) => setSubmittedParameters(values)}
            submitting={isLoading}
          />
        </Card>

        <ResultsDisplay loading={isLoading} {...(calculation ? { results: calculation } : {})} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Projected Profitability" subtitle="12-month cash flow outlook">
          <ProfitabilityChart values={projectedSeries} />
        </Card>
        <Card title="Cost Composition" subtitle="Monthly operating cost mix">
          <CostBreakdownChart
            electricity={calculation?.costs.electricityPerMonth ?? 0}
            maintenance={calculation?.costs.maintenancePerMonth ?? 0}
            other={Math.max(
              0,
              (calculation?.costs.totalOperatingPerMonth ?? 0) -
                (calculation?.costs.electricityPerMonth ?? 0) -
                (calculation?.costs.maintenancePerMonth ?? 0),
            )}
          />
        </Card>
        <Card title="Price Sensitivity" subtitle="Market versus break-even dynamics">
          <BreakEvenChart
            breakEvenPrice={calculation?.profitability.breakEvenBtcPrice ?? 0}
            currentPrice={marketData?.btcPriceUSD ?? 0}
          />
        </Card>
      </div>

      <ScenarioComparison {...(scenarios ? { data: scenarios } : {})} />
    </div>
  );
}
