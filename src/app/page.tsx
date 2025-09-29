import Link from "next/link";
import { Card } from "@/components/ui";
import { Navigation } from "@/components/layout/Navigation";

const FEATURES = [
  {
    title: "Live Market Signals",
    description: "Streaming Bitcoin price, network hash rate, and difficulty in one view.",
  },
  {
    title: "Financial Grade Modeling",
    description: "ROI, payback period, and NPV calculations tailored for mining operations.",
  },
  {
    title: "Scenario Planning",
    description:
      "Stress-test profitability across price swings, difficulty shifts, and power costs.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-6">
          <Navigation />
          <h1 className="text-4xl font-bold text-slate-100 sm:text-5xl">
            Data-driven Bitcoin mining economics at your fingertips.
          </h1>
          <p className="text-lg text-ore-300">
            HashRate IQ pairs real-time market feeds with battle-tested financial models so you can
            price hardware, forecast cash flow, and scale operations with confidence.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/calculator"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-btc-orange px-6 text-sm font-semibold text-coal-900 transition hover:bg-btc-orange-dark"
            >
              Launch Calculator
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-coal-700 px-6 text-sm font-semibold text-slate-100 transition hover:border-btc-orange hover:text-btc-orange"
            >
              View Operations Dashboard
            </Link>
          </div>
        </div>
        <Card className="w-full max-w-md gap-4">
          <p className="text-sm uppercase tracking-wide text-ore-300">Key Metrics</p>
          <div className="space-y-4">
            <div>
              <p className="metric-label">Network Hash Rate</p>
              <p className="metric-value">520 EH/s</p>
              <p className="text-xs text-ore-300">Updated {new Date().toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="metric-label">Bitcoin Price</p>
              <p className="metric-value">$68,000</p>
              <p className="text-xs text-ore-300">Powered by CoinGecko</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} title={feature.title} subtitle={feature.description} />
        ))}
      </section>
    </div>
  );
}
