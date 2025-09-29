import { z } from "zod";

export const MiningParametersSchema = z.object({
  hashRate: z
    .number({ required_error: "Hash rate is required" })
    .nonnegative("Hash rate cannot be negative")
    .max(1_000, "Hash rate exceeds realistic limits"),
  powerConsumption: z
    .number({ required_error: "Power consumption is required" })
    .nonnegative("Power consumption cannot be negative")
    .max(1_000, "Power consumption exceeds realistic limits"),
  electricityRate: z
    .number({ required_error: "Electricity rate is required" })
    .nonnegative("Electricity rate cannot be negative")
    .max(5, "Electricity rate seems unrealistic"),
  hardwareCost: z
    .number({ required_error: "Hardware cost is required" })
    .nonnegative("Hardware cost cannot be negative")
    .max(50_000_000, "Hardware cost exceeds supported range"),
  setupCost: z
    .number({ required_error: "Setup cost is required" })
    .nonnegative("Setup cost cannot be negative")
    .max(10_000_000, "Setup cost exceeds supported range"),
  maintenanceCost: z
    .number({ required_error: "Maintenance cost is required" })
    .nonnegative("Maintenance cost cannot be negative")
    .max(5_000_000, "Maintenance cost exceeds supported range"),
});

export const MarketConditionsSchema = z.object({
  btcPriceUSD: z
    .number({ required_error: "BTC price is required" })
    .positive("BTC price must be positive")
    .max(1_000_000, "BTC price exceeds supported range"),
  networkHashRateEHS: z
    .number({ required_error: "Network hash rate is required" })
    .positive("Network hash rate must be positive")
    .max(10_000, "Network hash rate exceeds supported range"),
  difficulty: z
    .number({ required_error: "Difficulty is required" })
    .positive("Difficulty must be positive"),
  blockReward: z
    .number({ required_error: "Block reward is required" })
    .positive("Block reward must be positive")
    .max(10, "Block reward exceeds supported range"),
});

export const MarketSnapshotSchema = MarketConditionsSchema.extend({
  lastUpdated: z
    .string({ required_error: "Last updated timestamp is required" })
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Last updated must be a valid ISO timestamp",
    }),
  priceSource: z
    .string({ required_error: "Price source is required" })
    .min(1, "Price source cannot be empty")
    .max(100, "Price source is too long"),
  hashRateSource: z
    .string({ required_error: "Hash rate source is required" })
    .min(1, "Hash rate source cannot be empty")
    .max(100, "Hash rate source is too long"),
});

export const CalculationAssumptionsSchema = z.object({
  networkGrowthMonthly: z
    .number()
    .min(-0.5, "Network growth cannot reduce more than 50% per month")
    .max(0.5, "Network growth cannot increase more than 50% per month")
    .default(0.02),
  discountRateAnnual: z
    .number()
    .min(0, "Discount rate cannot be negative")
    .max(1, "Discount rate cannot exceed 100%")
    .default(0.1),
  depreciationMonths: z
    .number()
    .int()
    .min(1, "Depreciation period must be at least 1 month")
    .max(120, "Depreciation period cannot exceed 10 years")
    .default(36),
  projectionMonths: z
    .number()
    .int()
    .min(1, "Projection must include at least one month")
    .max(120, "Projection cannot exceed 10 years")
    .default(12),
});

export const CalculationInputSchema = z.object({
  parameters: MiningParametersSchema,
  market: MarketConditionsSchema,
  assumptions: CalculationAssumptionsSchema.partial().optional(),
});

export const ScenarioSchema = z.object({
  name: z.string().min(1).max(50),
  btcPriceMultiplier: z.number().min(0.1).max(10),
  networkGrowthRate: z.number().min(-0.5).max(0.5),
  electricityRateMultiplier: z.number().min(0.1).max(5),
});

export type MiningParametersInput = z.infer<typeof MiningParametersSchema>;
export type MarketConditionsInput = z.infer<typeof MarketConditionsSchema>;
export type CalculationAssumptionsInput = z.infer<typeof CalculationAssumptionsSchema>;
