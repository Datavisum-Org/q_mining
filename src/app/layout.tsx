import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HashRate IQ | Bitcoin Mining Economics",
    template: "%s | HashRate IQ",
  },
  description:
    "Model Bitcoin mining profitability with real-time market data, detailed cost breakdowns, and ROI projections tailored for mining operators.",
  metadataBase: new URL("https://hashrate-iq.vercel.app"),
  keywords: [
    "bitcoin mining",
    "profitability calculator",
    "hash rate analysis",
    "mining economics",
    "crypto operations",
  ],
  openGraph: {
    title: "HashRate IQ | Bitcoin Mining Economics",
    description:
      "Interactive profitability models and market data for miners, investors, and operations teams.",
    url: "https://hashrate-iq.vercel.app",
    siteName: "HashRate IQ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HashRate IQ",
    description:
      "Bitcoin mining profitability insights powered by live market data and financial modeling.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-coal-900 font-sans text-slate-100">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
