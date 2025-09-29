"use client";

import { memo, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProfitabilityChartProps {
  values: number[];
}

export const ProfitabilityChart = memo(function ProfitabilityChart({
  values,
}: ProfitabilityChartProps) {
  const data = useMemo(
    () =>
      values.map((value, index) => ({
        month: index + 1,
        value,
        cumulative: values.slice(0, index + 1).reduce((total, current) => total + current, 0),
      })),
    [values],
  );

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ore-300">
        Run a calculation to visualize profitability trends.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
        <XAxis dataKey="month" stroke="rgba(226,232,240,0.7)" tick={{ fontSize: 12 }} />
        <YAxis
          stroke="rgba(226,232,240,0.7)"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
        />
        <Tooltip
          contentStyle={{ background: "#111827", borderColor: "#1f2937" }}
          formatter={(value: number, name) => [
            `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            name === "value" ? "Monthly Profit" : "Cumulative",
          ]}
        />
        <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="#f7931a"
          strokeDasharray="6 4"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
