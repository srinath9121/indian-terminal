import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Badge from "../components/ui/Badge";
import Section from "../components/ui/Section";
import { useTerminalStore } from "../store/useTerminalStore";
import Globe from "../components/globe/Globe";

export default function Pulse() {
  const { marketData, macroData, adaniStocks, globalSignal, isLoading } = useTerminalStore();

  const fiiNet   = marketData?.fii_flows?.net_value ?? marketData?.fiiFlows?.netValue;
  const fiiTrend = marketData?.fii_flows?.trend     ?? marketData?.fiiFlows?.trend;

  const macroCards = [
    { label: "Growth",      value: macroData?.gdp?.value      ? `${macroData.gdp.value}%`      : "--", tone: macroData?.gdp?.status === 'Strong' ? 'bullish' : 'neutral', meta: macroData?.gdp?.unit      ?? "GDP YoY" },
    { label: "Inflation",   value: macroData?.inflation?.value ? `${macroData.inflation.value}%` : "--", tone: "defensive", meta: macroData?.inflation?.unit ?? "CPI YoY" },
    { label: "Liquidity",   value: macroData?.liquidity?.value ? `₹${(macroData.liquidity.value/1000).toFixed(0)}k Cr` : "--", tone: macroData?.liquidity?.status === 'Surplus' ? 'bullish' : 'neutral', meta: "System liquidity" },
    { label: "FII Flow",    value: fiiNet != null ? `₹${fiiNet.toLocaleString()} Cr` : "--", tone: fiiTrend === 'outflow' ? 'defensive' : 'bullish', meta: "Net institutional flow" },
    { label: "Market Bias", value: globalSignal?.state || "CALCULATING", tone: globalSignal?.state === 'BULLISH' ? 'bullish' : globalSignal?.state === 'DEFENSIVE' ? 'defensive' : 'neutral', meta: `Confidence: ${globalSignal?.confidence ?? 0}%` },
  ];

  const signals = (adaniStocks || []).slice(0, 5).map(s => ({
    name: s.symbol,
    price: `₹${s.price}`,
    state: s.conf > 60 ? "BULLISH" : s.conf < 50 ? "DEFENSIVE" : "NEUTRAL",
    conf: s.conf,
    tone: s.conf > 60 ? "bullish" : s.conf < 50 ? "defensive" : "neutral"
  }));

  const alerts = [
    { title: "Correlation Spike Detected", desc: "Adani group correlation has risen above 0.85", time: "10:23 AM", tone: "defensive" },
    { title: "FII Outflow Continues", desc: "Net FII selling for 3rd consecutive day", time: "10:15 AM", tone: "neutral" },
    { title: "Oil Price Surge", desc: "Brent crude above $85/barrel", time: "10:10 AM", tone: "defensive" },
  ];

  if (isLoading && !marketData) {
    return <Layout><div className="flex h-screen items-center justify-center text-[var(--muted)] animate-pulse">CONNECTING TO TERMINAL...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <Grid cols={5}>
          {macroCards.map((item) => (
            <Card key={item.label} className="min-h-[170px]">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{item.label}</div>
                  <div className="mt-3 text-2xl font-bold">{item.value}</div>
                  <div className="mt-2 text-xs text-[var(--muted)]">{item.meta}</div>
                </div>
                <div className="mt-4">
                  <Badge tone={item.tone}>{item.value}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </Grid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Section title="WHAT CHANGED THIS WEEK">
              <div className="space-y-3 text-sm text-[var(--muted)]">
                <div>↘ FII turned net sellers after 5 weeks</div>
                <div>↗ Brent crude crossed $85/barrel</div>
                <div>↘ RBI commentary turned slightly hawkish</div>
                <div>↗ India CPI came in higher than expected</div>
                <div>↗ US 10Y bond yield moved above 4.6%</div>
              </div>
            </Section>

            <Section title="ADANI GROUP SIGNALS">
              <Grid cols={5}>
                {signals.map((s) => (
                  <Card key={s.name} className="min-h-[180px]">
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="mt-2 text-xl font-bold">{s.price}</div>
                      </div>
                      <div className="space-y-2">
                        <Badge tone={s.tone}>{s.state}</Badge>
                        <div className="text-xs text-[var(--muted)]">Conf: {s.conf}%</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Grid>
            </Section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Section title="MARKET SNAPSHOT">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "NIFTY", val: marketData?.nifty?.price || "--" }, 
                    { name: "SENSEX", val: marketData?.sensex?.price || "--" }, 
                    { name: "BANKNIFTY", val: marketData?.bankNifty?.price || "--" }, 
                    { name: "VIX", val: marketData?.vix?.price || "--" }
                  ].map((x) => (
                    <Card key={x.name}>
                      <div className="text-xs text-[var(--muted)]">{x.name}</div>
                      <div className="mt-2 text-2xl font-bold">{x.val}</div>
                    </Card>
                  ))}
                </div>
              </Section>

              <Section title="AI SUMMARY">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  The market remains under pressure with high correlation across the Adani group, weak flows,
                  and a defensive macro backdrop. Short-term bias remains cautious.
                </p>
                {globalSignal?.reasons?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {globalSignal.reasons.map((r, i) => (
                      <div key={i} className="text-xs text-[var(--red)]">• {r}</div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <Section title="CAUSAL CHAIN IN FOCUS">
              <div className="flex flex-wrap gap-3">
                {(globalSignal?.causal_chain || ["Macro Stable", "Inflation ↓", "RBI Pause", "Growth ↑", "Market ↑"]).map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="rounded-xl border border-[var(--border)] bg-[#0f1520] px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:border-white/20">
                      {step}
                    </div>
                    {i < (globalSignal?.causal_chain?.length || 5) - 1 && (
                      <span className="text-[var(--muted)] opacity-50">→</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="GLOBAL MACRO MAP">
              <div className="rounded-xl border border-[var(--border)] bg-[#0d1320] p-1 shadow-inner overflow-hidden">
                <Globe />
              </div>
            </Section>

            <Section title="LIVE ALERTS">
              <div className="space-y-4">
                {alerts.map((a) => (
                  <div key={a.title} className="border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`text-sm font-semibold ${a.tone === "defensive" ? "text-[var(--red)]" : "text-[var(--yellow)]"}`}>
                          {a.title}
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{a.desc}</div>
                      </div>
                      <div className="text-xs text-[var(--muted)]">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>

        <div className="terminal-card border border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)]">
          <span className="text-[var(--green)]">LIVE MARKET TICKER</span> | 
          NIFTY {marketData?.nifty?.price || "--"} | 
          SENSEX {marketData?.sensex?.price || "--"} | 
          BANKNIFTY {marketData?.bankNifty?.price || "--"} | 
          USD/INR {macroData?.usdInr?.price || "--"} | 
          CRUDE OIL {macroData?.brentCrude?.price || "--"}
        </div>
      </div>
    </Layout>
  );
}
