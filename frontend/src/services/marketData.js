import { fetchApi } from "./api";

const mock = {
  nifty:     { price: 24117.65, change: 181.95,  pct_change: 0.76,  direction: "up",   symbol: "NIFTY 50"  },
  sensex:    { price: 77496.36, change: 609.45,  pct_change: 0.79,  direction: "up",   symbol: "SENSEX"    },
  bank_nifty:{ price: 55403.60, change: 3.25,    pct_change: 0.01,  direction: "up",   symbol: "BANKNIFTY" },
  vix:       { price: 14.20,    change: -0.40,   pct_change: -2.74, direction: "down", symbol: "INDIAVIX"  },
  fii_flows: { net_value: -3247, trend: "outflow", streak_days: 3 },
  dii_flows: { net_value:  4102, trend: "inflow",  streak_days: 5 },
  data_quality: "MOCK",
  timestamp: new Date().toISOString(),
};

export async function getMarketOverview() {
  const data = await fetchApi("/market");
  return data || mock;
}
