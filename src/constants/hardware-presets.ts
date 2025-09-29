import type { MiningParameters } from "@/types/mining";

export interface HardwarePreset extends MiningParameters {
  id: string;
  label: string;
  manufacturer: string;
}

export const HARDWARE_PRESETS: HardwarePreset[] = [
  {
    id: "antminer-s21",
    label: "Antminer S21 Hydro",
    manufacturer: "Bitmain",
    hashRate: 0.2,
    powerConsumption: 4.36,
    electricityRate: 0.07,
    hardwareCost: 7800,
    setupCost: 500,
    maintenanceCost: 350,
  },
  {
    id: "whatsminer-m60",
    label: "WhatsMiner M60",
    manufacturer: "MicroBT",
    hashRate: 0.186,
    powerConsumption: 3.54,
    electricityRate: 0.07,
    hardwareCost: 6200,
    setupCost: 500,
    maintenanceCost: 325,
  },
  {
    id: "antminer-s19k",
    label: "Antminer S19k Pro",
    manufacturer: "Bitmain",
    hashRate: 0.12,
    powerConsumption: 2.36,
    electricityRate: 0.07,
    hardwareCost: 2100,
    setupCost: 400,
    maintenanceCost: 250,
  },
];
