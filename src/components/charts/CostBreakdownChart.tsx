"use client";

import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface CostBreakdownChartProps {
  electricity: number;
  maintenance: number;
  other?: number;
}

const COLORS = ["#f7931a", "#34d399", "#38bdf8"];

export const CostBreakdownChart = memo(function CostBreakdownChart({
  electricity,
  maintenance,
  other = 0,
}: CostBreakdownChartProps) {
  const data = [
    { name: "Electricity", value: electricity },
    { name: "Maintenance", value: maintenance },
    { name: "Other", value: other },
  ].filter((entry) => entry.value > 0);

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ore-300">
        Add cost inputs to visualize the breakdown.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie data={data} innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#111827", borderColor: "#1f2937", color: "#e2e8f0" }}
          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});
