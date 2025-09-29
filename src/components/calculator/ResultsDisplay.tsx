import type { CalculationResults } from "@/types/mining";
import { Card } from "@/components/ui";
import { percent, usd } from "@/lib/utils";

interface ResultsDisplayProps {
  results?: CalculationResults;
  loading?: boolean;
}

const PLACEHOLDER_TEXT = "Run a calculation to see profitability analytics.";

export function ResultsDisplay({ results, loading }: ResultsDisplayProps) {
  if (loading) {
    return (
      <Card title="Results" subtitle="Mining profitability overview">
        <div className="flex h-32 items-center justify-center text-ore-300">
          Calculating profitability...
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card title="Results" subtitle="Mining profitability overview">
        <p className="text-sm text-ore-300">{PLACEHOLDER_TEXT}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Revenue & Output" subtitle="Projected mining returns" className="gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="metric-label">Daily Revenue</p>
            <p className="metric-value">{usd(results.revenue.usdPerDay)}</p>
            <p className="text-xs text-ore-300">{results.revenue.btcPerDay} BTC</p>
          </div>
          <div>
            <p className="metric-label">Monthly Revenue</p>
            <p className="metric-value">{usd(results.revenue.usdPerMonth)}</p>
            <p className="text-xs text-ore-300">{usd(results.revenue.usdPerYear)} yearly</p>
          </div>
        </div>
      </Card>

      <Card title="Cost Structure" subtitle="Operating expense profile" className="gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="metric-label">Electricity</p>
            <p className="metric-value">{usd(results.costs.electricityPerMonth)}</p>
            <p className="text-xs text-ore-300">{usd(results.costs.electricityPerDay)} per day</p>
          </div>
          <div>
            <p className="metric-label">Maintenance</p>
            <p className="metric-value">{usd(results.costs.maintenancePerMonth)}</p>
            <p className="text-xs text-ore-300">
              {usd(results.costs.totalOperatingPerMonth)} total OpEx
            </p>
          </div>
        </div>
      </Card>

      <Card title="Profitability" subtitle="Net performance metrics" className="gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="metric-label">Net Profit / Month</p>
            <p className="metric-value">{usd(results.profitability.netProfitPerMonth)}</p>
            <p className="text-xs text-ore-300">
              Margin {percent(results.profitability.profitMarginPercent)}
            </p>
          </div>
          <div>
            <p className="metric-label">Break-even BTC Price</p>
            <p className="metric-value">{usd(results.profitability.breakEvenBtcPrice)}</p>
            <p className="text-xs text-ore-300">Current market sensitivity</p>
          </div>
        </div>
      </Card>

      <Card title="Investment" subtitle="Capital efficiency snapshot" className="gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="metric-label">Initial Investment</p>
            <p className="metric-value">{usd(results.investment.totalInitialInvestment)}</p>
            <p className="text-xs text-ore-300">
              Payback {results.investment.paybackPeriodMonths} months
            </p>
          </div>
          <div>
            <p className="metric-label">Annual ROI</p>
            <p className="metric-value">{percent(results.investment.annualROI)}</p>
            <p className="text-xs text-ore-300">NPV (12m) {usd(results.investment.npv12Months)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
