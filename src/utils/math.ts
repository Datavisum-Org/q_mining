const EPSILON = 1e-12;

export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function safeDivide(
  numerator: number,
  denominator: number,
  fallback = 0,
  decimals?: number,
): number {
  if (Math.abs(denominator) <= EPSILON) {
    return fallback;
  }

  const result = numerator / denominator;
  return typeof decimals === "number" ? roundTo(result, decimals) : result;
}

export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function npv(
  cashFlows: readonly number[],
  discountRate: number,
  initialInvestment: number,
): number {
  const monthlyRate = safeDivide(discountRate, 12, 0);
  const discounted = cashFlows.map(
    (cashFlow, index) => cashFlow / (1 + monthlyRate) ** (index + 1),
  );
  return sum(discounted) - initialInvestment;
}

export function cumulative(values: readonly number[]): number[] {
  let runningTotal = 0;
  return values.map((value) => {
    runningTotal += value;
    return runningTotal;
  });
}
