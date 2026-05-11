import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Badge from "../components/ui/Badge";
import Section from "../components/ui/Section";
import { useTerminalStore } from "../store/useTerminalStore";

export default function AdaniIntel() {
  const { adaniStocks, globalSignal, isLoading } = useTerminalStore();

  if (isLoading && adaniStocks.length === 0) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center text-[var(--muted)] animate-pulse">
          FETCHING ADANI INTELLIGENCE...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <Grid cols={3}>
          {adaniStocks.map((stock) => (
            <Card key={stock.symbol}>
              <div className="flex h-full flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-[var(--muted)] tracking-wider uppercase">
                      {stock.symbol}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      ₹{stock.price.toLocaleString()}
                    </div>
                  </div>
                  <Badge tone={stock.direction === "up" ? "bullish" : "defensive"}>
                    {stock.decision}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">Danger Score</span>
                    <span className={stock.conf < 50 ? "text-[var(--red)]" : "text-[var(--green)]"}>
                      {100 - stock.conf}/100
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                    <div 
                      className={`h-full transition-all duration-1000 ${stock.conf < 50 ? "bg-[var(--red)]" : "bg-[var(--green)]"}`}
                      style={{ width: `${100 - stock.conf}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] italic leading-relaxed text-[var(--muted)] line-clamp-2">
                  {stock.causalChain || "Analyzing macro transmission..."}
                </div>
              </div>
            </Card>
          ))}
        </Grid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Section title="ADANI CAUSAL CHAIN IN FOCUS">
            <div className="flex flex-wrap gap-3">
              {(globalSignal?.causal_chain || ["Macro Stable", "Inflation ↓", "Growth ↑", "Market ↑"]).map((step, i) => (
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
            <div className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
              This chain represents the deterministic transmission of macro stressors (Oil, USD/INR, Yields) 
              into the Adani Group's capital structure and market valuation.
            </div>
          </Section>

          <Section title="RISK EXPLAINER">
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--border)] bg-[#0d1320] p-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Group Correlation</div>
                <div className="text-2xl font-bold text-[var(--green)]">0.42</div>
                <div className="mt-1 text-[10px] text-[var(--muted)]">Moderate decouple from broad market</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[#0d1320] p-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Refinancing Outlook</div>
                <div className="text-2xl font-bold text-[var(--muted)]">STABLE</div>
                <div className="mt-1 text-[10px] text-[var(--muted)]">Debt-to-EBITDA within threshold</div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Layout>
  );
}
