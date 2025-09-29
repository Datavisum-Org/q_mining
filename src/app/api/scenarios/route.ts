import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { miningCalculator } from "@/lib/calculations";
import { MarketSnapshotSchema, MiningParametersSchema, ScenarioSchema } from "@/lib/validations";
import type { MarketSnapshot } from "@/types/market";

const ScenarioRequestSchema = z.object({
  base: MiningParametersSchema,
  market: MarketSnapshotSchema,
  scenarios: z.array(ScenarioSchema).min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { base, market, scenarios } = ScenarioRequestSchema.parse(json);

    const results = scenarios.map((scenario) => {
      const adjustedMarket = {
        ...market,
        btcPriceUSD: market.btcPriceUSD * scenario.btcPriceMultiplier,
        networkHashRateEHS: market.networkHashRateEHS * (1 + scenario.networkGrowthRate),
      } as MarketSnapshot;

      const adjustedParameters = {
        ...base,
        electricityRate: base.electricityRate * scenario.electricityRateMultiplier,
      };

      const calculation = miningCalculator.calculate(adjustedParameters, adjustedMarket);

      return {
        scenario: scenario.name,
        netProfitPerMonth: calculation.profitability.netProfitPerMonth,
        paybackPeriodMonths: calculation.investment.paybackPeriodMonths,
        annualROI: calculation.investment.annualROI,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        comparedAt: new Date().toISOString(),
        baseScenario: "Base Inputs",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to compare scenarios" }, { status: 500 });
  }
}
