import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { miningCalculator } from "@/lib/calculations";
import { MarketSnapshotSchema, MiningParametersSchema } from "@/lib/validations";
import type { MarketSnapshot } from "@/types/market";

const FALLBACK_MARKET: MarketSnapshot = {
  btcPriceUSD: 68_000,
  networkHashRateEHS: 520,
  difficulty: 83_000_000_000_000,
  blockReward: 3.125,
  lastUpdated: new Date().toISOString(),
  priceSource: "internal",
  hashRateSource: "internal",
};

const CalculationSchema = z.object({
  parameters: MiningParametersSchema,
  marketData: MarketSnapshotSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { parameters, marketData } = CalculationSchema.parse(json);

    const market = (marketData ?? {
      ...FALLBACK_MARKET,
      lastUpdated: new Date().toISOString(),
    }) as MarketSnapshot;

    const results = miningCalculator.calculate(parameters, market);

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        calculatedAt: new Date().toISOString(),
        marketDataAge: market.lastUpdated,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to run calculations" }, { status: 500 });
  }
}
