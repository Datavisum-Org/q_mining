export interface OperationRow {
  id: string;
  name: string;
  hash_rate: string;
  power_consumption: string;
  electricity_rate: string;
  hardware_cost: string;
  setup_cost: string | null;
  maintenance_cost: string | null;
  hardware_type: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationInsert {
  name: string;
  hashRate: number;
  powerConsumption: number;
  electricityRate: number;
  hardwareCost: number;
  setupCost?: number;
  maintenanceCost?: number;
  hardwareType?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface OperationUpdate {
  name?: string;
  hashRate?: number;
  powerConsumption?: number;
  electricityRate?: number;
  hardwareCost?: number;
  setupCost?: number | null;
  maintenanceCost?: number | null;
  hardwareType?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface OperationRecord {
  id: string;
  name: string;
  hashRate: number;
  powerConsumption: number;
  electricityRate: number;
  hardwareCost: number;
  setupCost: number;
  maintenanceCost: number;
  hardwareType: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketDataCacheRow {
  id: string;
  btc_price_usd: string;
  network_hash_rate_ehs: string;
  difficulty: string;
  block_reward: string | null;
  price_source: string;
  hash_rate_source: string;
  fetched_at: string;
}

export interface MarketDataCacheInsert {
  btcPriceUsd: number;
  networkHashRateEhs: number;
  difficulty: number;
  blockReward?: number;
  priceSource: string;
  hashRateSource: string;
  fetchedAt?: Date;
}

export interface MarketDataCacheRecord {
  id: string;
  btcPriceUsd: number;
  networkHashRateEhs: number;
  difficulty: number;
  blockReward: number;
  priceSource: string;
  hashRateSource: string;
  fetchedAt: string;
}

export interface CalculationCacheRow {
  id: string;
  parameters_hash: string;
  results: unknown;
  calculated_at: string;
  expires_at: string;
}

export interface CalculationCacheInsert {
  parametersHash: string;
  results: unknown;
  expiresAt: Date;
}

export interface CalculationCacheRecord {
  id: string;
  parametersHash: string;
  results: unknown;
  calculatedAt: string;
  expiresAt: string;
}
