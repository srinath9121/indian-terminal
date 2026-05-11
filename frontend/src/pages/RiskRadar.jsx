import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Section from "../components/ui/Section";
import Badge from "../components/ui/Badge";
import { useTerminalStore } from "../store/useTerminalStore";

function riskColor(v) {
  if (v >= 70) return "var(--red)";
  if (v >= 50) return "var(--yellow)";
  return "var(--green)";
}

function riskTone(v) {
  if (v >= 70) return "defensive";
  if (v >= 50) return "neutral";
  return "bullish";
}

export default function RiskRadar() {
  const { macroData, marketData, alertsData, globalSignal } = useTerminalStore();

  const brent   = macroData?.brent_crude?.price ?? 80;
  const vix     = marketData?.vix?.price ?? 14;
  const fiiNet  = marketData?.fii_flows?.net_value ?? 0;
  const irsScore = macroData?.irs?.score ?? 50;
  const inflation = macroData?.inflation?.value ?? 5;
  const usdInr  = macroData?.usd_inr?.price ?? 83;

  // Compute individual risk scores
  const macroRisk   = Math.min(100, Math.round((brent - 60) / 50 * 60 + inflation * 4));
  const marketRisk  = Math.min(100, Math.round(vix * 3.5));
  const liqRisk     = Math.min(100, Math.round(Math.max(0, -fiiNet / 50)));
  const creditRisk  = Math.min(100, Math.round(irsScore * 0.7 + 15));
  const geoRisk     = Math.min(100, Math.round(brent > 85 ? 70 + (brent - 85) * 2 : 40 + vix));
  const commodRisk  = Math.min(100, Math.round((brent - 60) / 50 * 100));
  const volRisk     = Math.min(100, Math.round(vix * 4));

  const risks = [
    ["Macro Risk",       macroRisk],
    ["Market Risk",      marketRisk],
    ["Liquidity Risk",   liqRisk],
    ["Credit Risk",      creditRisk],
    ["Geopolitical Risk",geoRisk],
    ["Commodity Risk",   commodRisk],
    ["Volatility Risk",  volRisk],
  ];

  const overall = Math.round(risks.reduce((s, [, v]) => s + v, 0) / risks.length);

  // Top risk factors — sorted by score desc
  const sortedRisks = [...risks].sort((a, b) => b[1] - a[1]);

  // Live alerts from backend
  const liveAlerts = alertsData?.alerts?.slice(0, 4) ?? [
    { title: "Crude oil above $85/barrel", priority: "High" },
    { title: "FII outflows exceed threshold", priority: "High" },
    { title: "RBI maintains hawkish stance", priority: "Medium" },
    { title: "Global inflation above expectations", priority: "Medium" },
  ];

  // Gauge arc
  const gaugeAngle = (overall / 100) * 180;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <Grid cols={3}>
          {/* Overall Risk Gauge */}
          <Section title="OVERALL RISK SCORE">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-[180px] w-[180px] items-center justify-end" style={{ flexDirection: "column" }}>
                {/* Background arc */}
                <div className="absolute top-0 h-[90px] w-[180px] overflow-hidden">
                  <div className="h-[180px] w-[180px] rounded-full border-[12px] border-[var(--border)]" />
                </div>
                {/* Filled arc */}
                <div className="absolute top-0 h-[90px] w-[180px] overflow-hidden">
                  <div
                    className="h-[180px] w-[180px] rounded-full border-[12px] transition-all duration-700"
                    style={{
                      borderColor: riskColor(overall),
                      clipPath: `polygon(0 0, 50% 50%, ${50 + 50 * Math.cos(Math.PI - (gaugeAngle * Math.PI) / 180)}% ${50 - 50 * Math.sin(Math.PI - (gaugeAngle * Math.PI) / 180)}%, 0 0)`,
                    }}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold" style={{ color: riskColor(overall) }}>{overall}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">/ 100</div>
                </div>
              </div>
              <Badge tone={riskTone(overall)}>
                {overall >= 70 ? "HIGH RISK" : overall >= 50 ? "ELEVATED" : "LOW RISK"}
              </Badge>
            </div>
          </Section>

          {/* Risk Breakdown Bars */}
          <Section title="RISK RADAR">
            <div className="space-y-3">
              {risks.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">{label}</span>
                    <span style={{ color: riskColor(value) }} className="font-semibold">{value}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${value}%`, backgroundColor: riskColor(value) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Top Risk Factors */}
          <Section title="TOP RISK FACTORS">
            <div className="space-y-3 text-sm">
              {sortedRisks.slice(0, 5).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">{label}</span>
                  <Badge tone={riskTone(value)}>{value >= 70 ? "High" : value >= 50 ? "Medium" : "Low"}</Badge>
                </div>
              ))}
            </div>
          </Section>
        </Grid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.1fr_0.9fr]">
          {/* Score Breakdown */}
          <Section title="RISK SCORE BREAKDOWN">
            <div className="space-y-3">
              {risks.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{label}</span>
                  <span style={{ color: riskColor(value) }} className="font-semibold">{value}</span>
                </div>
              ))}
              <div className="mt-4 border-t border-[var(--border)] pt-3 flex items-center justify-between text-sm font-bold">
                <span className="text-white">Overall</span>
                <span style={{ color: riskColor(overall) }}>{overall}</span>
              </div>
            </div>
          </Section>

          {/* Risk Drivers */}
          <Section title="RISK DRIVERS">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--muted)]">Brent Crude</span>
                <span className="text-white font-medium">${brent.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--muted)]">India VIX</span>
                <span className="text-white font-medium">{vix.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--muted)]">FII Net Flow</span>
                <span className={fiiNet < 0 ? "text-[var(--red)] font-medium" : "text-[var(--green)] font-medium"}>
                  ₹{fiiNet.toLocaleString()} Cr
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--muted)]">USD/INR</span>
                <span className="text-white font-medium">₹{usdInr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--muted)]">CPI Inflation</span>
                <span className="text-white font-medium">{inflation}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">IRS Score</span>
                <span style={{ color: riskColor(irsScore) }} className="font-medium">{irsScore}/100</span>
              </div>
            </div>
          </Section>

          {/* Risk Alerts */}
          <Section title="RISK ALERTS">
            <div className="space-y-3">
              {liveAlerts.map((a, i) => (
                <div key={a.id || i} className="flex items-start gap-2 text-sm">
                  <span
                    className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: a.priority === "High" ? "#ef4444" : a.priority === "Medium" ? "#f59e0b" : "#22c55e" }}
                  />
                  <span className="text-[var(--muted)]">{a.title}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </Layout>
  );
}
