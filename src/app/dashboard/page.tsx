import { Card } from "@/components/ui";

const KPI_CARDS = [
  {
    title: "Portfolio Hash Rate",
    value: "1.8 EH/s",
    detail: "Across 4 active sites",
  },
  {
    title: "Monthly Net Profit",
    value: "$425,000",
    detail: "+6.2% vs last month",
  },
  {
    title: "Average Power Rate",
    value: "$0.051/kWh",
    detail: "Blended across partners",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-100">Operations Dashboard</h1>
        <p className="text-ore-300">
          Monitor portfolio performance, track costs, and benchmark profitability across mining
          sites. This dashboard will evolve throughout the MVP rollout.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KPI_CARDS.map((card) => (
          <Card key={card.title} title={card.title} subtitle={card.detail}>
            <p className="metric-value">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card title="Coming Soon" subtitle="Detailed analytics and portfolio management">
        <p className="text-sm text-ore-300">
          Phase two of the MVP will introduce saved operations, interactive charts, and scenario
          planning tools. Stay tuned!
        </p>
      </Card>
    </div>
  );
}
