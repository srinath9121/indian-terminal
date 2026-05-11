import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Section from "../components/ui/Section";

const risks = [
  ["Macro Risk", 72],
  ["Market Risk", 68],
  ["Liquidity Risk", 74],
  ["Credit Risk", 58],
  ["Geopolitical Risk", 78],
  ["Commodity Risk", 63],
  ["Volatility Risk", 71],
];

export default function RiskRadar() {
  return (
    <Layout>
      <div className="space-y-6">
        <Grid cols={3}>
          <Section title="OVERALL RISK SCORE">
            <div className="flex h-[240px] items-center justify-center rounded-xl border border-[var(--border)] bg-[#0d1320] text-sm text-[var(--muted)]">
              Gauge / overall risk
            </div>
          </Section>

          <Section title="RISK RADAR">
            <div className="flex h-[240px] items-center justify-center rounded-xl border border-[var(--border)] bg-[#0d1320] text-sm text-[var(--muted)]">
              Radar chart placeholder
            </div>
          </Section>

          <Section title="TOP RISK FACTORS">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Crude Oil Prices</span><span className="text-[var(--red)]">High</span></div>
              <div className="flex justify-between"><span>Rising Inflation</span><span className="text-[var(--red)]">High</span></div>
              <div className="flex justify-between"><span>FII Outflows</span><span className="text-[var(--red)]">High</span></div>
              <div className="flex justify-between"><span>Global Rate Uncertainty</span><span className="text-[var(--yellow)]">Medium</span></div>
            </div>
          </Section>
        </Grid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.1fr_0.9fr]">
          <Section title="RISK SCORE BREAKDOWN">
            <div className="space-y-3">
              {risks.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{label}</span>
                  <span className={value >= 70 ? "text-[var(--red)]" : value >= 60 ? "text-[var(--yellow)]" : "text-[var(--green)]"}>{value}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="RISK TREND">
            <div className="flex h-[260px] items-center justify-center rounded-xl border border-[var(--border)] bg-[#0d1320] text-sm text-[var(--muted)]">
              Trend chart placeholder
            </div>
          </Section>

          <Section title="RISK ALERTS">
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <div>• Crude oil above $85/barrel</div>
              <div>• FII outflows exceed threshold</div>
              <div>• RBI maintains hawkish stance</div>
              <div>• Global inflation above expectations</div>
            </div>
          </Section>
        </div>
      </div>
    </Layout>
  );
}
