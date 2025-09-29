import "dotenv/config";

import { db } from "../src/lib/db";
import {
  calculationCacheRepository,
  marketDataRepository,
  operationsRepository,
} from "../src/lib/repositories";
import type { OperationInsert } from "../src/types/database";

const SAMPLE_OPERATIONS: OperationInsert[] = [
  {
    name: "West Texas Hydro Farm",
    hashRate: 0.25,
    powerConsumption: 6.5,
    electricityRate: 0.045,
    hardwareCost: 1_800_000,
    setupCost: 120_000,
    maintenanceCost: 35_000,
    hardwareType: "Antminer S21 Hydro",
    location: "West Texas, USA",
    notes: "Powered by wind-backed grid mix.",
  },
  {
    name: "Nordic Immersion Site",
    hashRate: 0.12,
    powerConsumption: 3.1,
    electricityRate: 0.032,
    hardwareCost: 950_000,
    setupCost: 80_000,
    maintenanceCost: 22_000,
    hardwareType: "WhatsMiner M60",
    location: "Northern Sweden",
    notes: "Immersion cooling using ambient air exchange.",
  },
];

async function seed() {
  await db.transaction(async (client) => {
    await client.query(
      "TRUNCATE calculation_cache, market_data_cache, operations RESTART IDENTITY CASCADE",
    );

    for (const operation of SAMPLE_OPERATIONS) {
      await operationsRepository.createOperation(operation, client);
    }

    await marketDataRepository.insertMarketData(
      {
        btcPriceUsd: 68_450,
        networkHashRateEhs: 532.4,
        difficulty: 85_112_345_889_221,
        blockReward: 3.125,
        priceSource: "coingecko",
        hashRateSource: "blockchain.info",
      },
      client,
    );

    await calculationCacheRepository.upsertCalculationCache(
      {
        parametersHash: "seed-hash",
        results: {
          revenue: {
            usdPerMonth: 185_000,
            usdPerDay: 6_050,
          },
          costs: {
            electricityPerMonth: 98_000,
            maintenancePerMonth: 35_000,
          },
        },
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      client,
    );
  });
}

seed()
  .then(async () => {
    console.info("Seed data inserted successfully.");
    await db.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Failed to seed data:", error);
    await db.end();
    process.exit(1);
  });
