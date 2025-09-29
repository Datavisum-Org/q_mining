"use client";

import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BreakEvenChartProps {
  breakEvenPrice: number;
  currentPrice: number;
}

export const BreakEvenChart = memo(function BreakEvenChart({
  breakEvenPrice,
  currentPrice,
}: BreakEvenChartProps) {
  const data = useMemo(() => {
    const lower = Math.min(currentPrice, breakEvenPrice) * 0.6;
    const upper = Math.max(currentPrice, breakEvenPrice) * 1.4;
    const steps = 12;
    const delta = (upper - lower) / steps;

    return new Array(steps + 1).fill(0).map((_, index) => {
      const price = lower + index * delta;
      return {
        price,
        profitability: price - breakEvenPrice,
      };
    });
  }, [breakEvenPrice, currentPrice]);

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="profit-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
        <XAxis
          dataKey="price"
          stroke="rgba(226,232,240,0.7)"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
        />
        <YAxis
          stroke="rgba(226,232,240,0.7)"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{ background: "#111827", borderColor: "#1f2937" }}
          formatter={(value: number) =>
            `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          }
          labelFormatter={(value: number) =>
            `BTC Price $${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          }
        />
        <ReferenceLine x={breakEvenPrice} stroke="#f97316" strokeWidth={2} label="Break-even" />
        <ReferenceLine x={currentPrice} stroke="#38bdf8" strokeWidth={2} label="Market" />
        <Area type="linear" dataKey="profitability" stroke="#34d399" fill="url(#profit-gradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
});
