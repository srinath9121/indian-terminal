import { fetchApi } from "./api";

const mock = {
  gdp:        { label: "GDP Growth",   value: 6.8, unit: "% YoY",    status: "Strong",  trend: "up"   },
  inflation:  { label: "CPI Inflation",value: 5.1, unit: "% YoY",    status: "Rising",  trend: "up"   },
  repo_rate:  { label: "Repo Rate",    value: 6.5, unit: "%",         status: "Neutral", trend: "flat" },
  liquidity:  { label: "System Liq.",  value: 162345, unit: "₹ Cr",  status: "Surplus", trend: "up"   },
  brent_crude:{ price: 85.12, change: -0.45, pct_change: -0.53, direction: "down" },
  usd_inr:    { price: 83.24, change:  0.15, pct_change:  0.18, direction: "up"   },
  irs:        { score: 52, zone: "MODERATE", mode: "NEUTRAL" },
  regime:     "NEUTRAL",
  data_quality: "MOCK",
  timestamp: new Date().toISOString(),
};

export async function getMacroIndicators() {
  const data = await fetchApi("/macro");
  return data || mock;
}
