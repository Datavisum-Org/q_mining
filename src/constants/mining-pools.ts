export interface MiningPool {
  id: string;
  name: string;
  feePercent: number;
  region: string;
  website: string;
}

export const MINING_POOLS: MiningPool[] = [
  {
    id: "foundry-usa",
    name: "Foundry USA",
    feePercent: 1.0,
    region: "North America",
    website: "https://foundrydigital.com",
  },
  {
    id: "antpool",
    name: "AntPool",
    feePercent: 1.0,
    region: "Global",
    website: "https://www.antpool.com",
  },
  {
    id: "f2pool",
    name: "F2Pool",
    feePercent: 2.5,
    region: "Asia",
    website: "https://www.f2pool.com",
  },
];
