import type { ScenarioComparisonResult } from "@/types/mining";
import { Card } from "@/components/ui";
import { usd } from "@/lib/utils";

interface ScenarioComparisonProps {
  data?: ScenarioComparisonResult[];
}

export function ScenarioComparison({ data }: ScenarioComparisonProps) {
  if (!data?.length) {
    return null;
  }

  return (
    <Card
      title="Scenario Comparison"
      subtitle="Highlighting profitability swings across market cases"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-100">
          <thead className="border-b border-coal-700 text-xs uppercase tracking-wide text-ore-300">
            <tr>
              <th className="pb-2 pr-6">Scenario</th>
              <th className="pb-2 pr-6">Net Profit / Month</th>
              <th className="pb-2 pr-6">Payback (months)</th>
              <th className="pb-2">Annual ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coal-800">
            {data.map((scenario) => (
              <tr key={scenario.scenario} className="hover:bg-coal-800/40">
                <td className="py-3 pr-6 font-medium">{scenario.scenario}</td>
                <td className="py-3 pr-6">{usd(scenario.netProfitPerMonth)}</td>
                <td className="py-3 pr-6">
                  {typeof scenario.paybackPeriodMonths === "number"
                    ? scenario.paybackPeriodMonths.toFixed(1)
                    : "—"}
                </td>
                <td className="py-3">{(scenario.annualROI * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
