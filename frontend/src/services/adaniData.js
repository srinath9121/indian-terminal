import { fetchApi } from "./api";

const mock = [
  { symbol: "ADANIENT",   price: 3142.25, change:  42.30, pct_change:  1.36, direction: "up",   danger_score: 38, decision: "HOLD", causal_chain: "Macro stable" },
  { symbol: "ADANIPORTS", price: 1341.10, change:  18.60, pct_change:  1.40, direction: "up",   danger_score: 42, decision: "HOLD", causal_chain: "Port volumes rising" },
  { symbol: "ADANIGREEN", price: 1062.70, change:  25.80, pct_change:  2.48, direction: "up",   danger_score: 35, decision: "HOLD", causal_chain: "Renewable policy tailwind" },
  { symbol: "ADANIPOWER", price: 597.85,  change:  -4.40, pct_change: -0.73, direction: "down", danger_score: 55, decision: "HOLD", causal_chain: "Coal price pressure" },
  { symbol: "ATGL",       price: 1012.45, change:  13.95, pct_change:  1.39, direction: "up",   danger_score: 40, decision: "HOLD", causal_chain: "City gas expansion" },
  { symbol: "ADANIWILM",  price: 380.20,  change:   5.80, pct_change:  1.55, direction: "up",   danger_score: 44, decision: "HOLD", causal_chain: "Cement demand strong" },
];

function dangerToConf(score) {
  return Math.max(0, Math.min(100, 100 - score));
}

export async function getAdaniStocks() {
  const data = await fetchApi("/adani");
  const stocks = data?.stocks;
  if (!stocks || stocks.length === 0) return mock.map(s => ({ ...s, conf: dangerToConf(s.danger_score) }));
  return stocks.map(s => ({ ...s, conf: dangerToConf(s.danger_score ?? 50) }));
}
