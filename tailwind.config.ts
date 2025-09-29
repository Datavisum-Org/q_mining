import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "coal-900": "#0b1120",
        "coal-800": "#111827",
        "coal-700": "#1f2937",
        "ore-500": "#334155",
        "ore-300": "#64748b",
        "hash-green": "#34d399",
        "hash-green-dark": "#059669",
        "btc-orange": "#f7931a",
        "btc-orange-dark": "#c76d00",
        "energy-yellow": "#fbbf24",
        skyline: "#0ea5e9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        mining: "0 20px 45px -15px rgba(12, 74, 110, 0.45)",
      },
      backgroundImage: {
        "hash-grid":
          "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)",
      },
      backgroundSize: {
        "hash-grid": "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
