import { z } from "zod";

export const MiningParametersSchema = z.object({
  hashRate: z
    .number({ required_error: "Hash rate is required" })
    .positive("Hash rate must be positive"),
  powerConsumption: z
    .number({ required_error: "Power consumption is required" })
    .positive("Power consumption must be positive")
    .max(500, "Power consumption exceeds typical facility scales"),
  electricityRate: z
    .number({ required_error: "Electricity rate is required" })
    .positive("Electricity rate must be positive")
    .max(1, "Please double-check the electricity rate"),
  hardwareCost: z
    .number({ required_error: "Hardware cost is required" })
    .nonnegative("Hardware cost cannot be negative"),
  setupCost: z.number().nonnegative().default(0),
  maintenanceCost: z.number().nonnegative().default(0),
});

export const MarketSnapshotSchema = z.object({
  btcPriceUSD: z.number().positive(),
  networkHashRateEHS: z.number().positive(),
  difficulty: z.number().positive(),
  blockReward: z.number().positive().default(3.125),
  lastUpdated: z.string(),
  priceSource: z.string().optional(),
  hashRateSource: z.string().optional(),
});

export const ScenarioSchema = z.object({
  name: z.string().min(1).max(50),
  btcPriceMultiplier: z.number().min(0.1).max(10),
  networkGrowthRate: z.number().min(-0.5).max(1),
  electricityRateMultiplier: z.number().min(0.1).max(5),
});

export const OperationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  hardwareType: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type MiningParametersInput = z.infer<typeof MiningParametersSchema>;
export type MarketSnapshotInput = z.infer<typeof MarketSnapshotSchema>;
export type ScenarioInput = z.infer<typeof ScenarioSchema>;
