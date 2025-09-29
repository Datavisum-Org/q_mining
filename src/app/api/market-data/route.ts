import { NextResponse } from "next/server";
import { MarketSnapshotSchema } from "@/lib/validations";

const MOCK_MARKET_DATA = {
  btcPriceUSD: 68000,
  networkHashRateEHS: 520,
  difficulty: 83_000_000_000_000,
  blockReward: 3.125,
  lastUpdated: new Date().toISOString(),
  priceSource: "coingecko",
  hashRateSource: "blockchain.info",
};

export async function GET() {
  try {
    const payload = MarketSnapshotSchema.parse(MOCK_MARKET_DATA);

    return NextResponse.json(
      { data: payload, cachedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load market data" }, { status: 500 });
  }
}
