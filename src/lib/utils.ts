import { roundTo, safeDivide as safeDivideInternal } from "@/utils/math";

export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  return safeDivideInternal(numerator, denominator, fallback);
}

export function toFixed(value: number, decimals: number): number {
  return roundTo(value, decimals);
}

export function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

export function usd(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

export function percent(value: number, maximumFractionDigits = 2): string {
  return `${roundTo(value * 100, maximumFractionDigits)}%`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
