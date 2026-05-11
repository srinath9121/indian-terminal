import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Section from "../components/ui/Section";
import Badge from "../components/ui/Badge";
import { useTerminalStore } from "../store/useTerminalStore";

function riskColor(v) {
  if (v >= 70) return "var(--red)";
  if (v >= 50) return "var(--yellow)";
  return "var(--green)";
}

export default function RiskRadar() {
  const { macroData, marketData, alertsData } = useTerminalStore();

  const brent   = macroData?.brent_crude?.price ?? 85.12;
  const vix     = marketData?.vix?.price ?? 14.82;
  const fiiNet  = marketData?.fii_flows?.net_value ?? -3247;
  const inflation = macroData?.inflation?.value ?? 5.1;
  const usdInr  = macroData?.usd_inr?.price ?? 83.24;

  const macroRisk   = Math.min(100, Math.round((brent - 60) / 40 * 60 + inflation * 4));
  const marketRisk  = Math.min(100, Math.round(vix * 3.5));
  const liqRisk     = Math.min(100, Math.round(Math.abs(fiiNet) / 100));
  const creditRisk  = 58;
  const geoRisk     = Math.min(100, Math.round(brent > 85 ? 70 : 40));
  const commodRisk  = Math.min(100, Math.round((brent - 60) / 40 * 100));
  const volRisk     = Math.min(100, Math.round(vix * 4));

  const risks = [
    ["MACRO RISK",       macroRisk],
    ["MARKET RISK",      marketRisk],
    ["LIQUIDITY RISK",   liqRisk],
    ["CREDIT RISK",      creditRisk],
    ["GEOPOLITICAL RISK",geoRisk],
    ["COMMODITY RISK",   commodRisk],
    ["VOLATILITY RISK",  volRisk],
  ];

  const overall = Math.round(risks.reduce((s, [, v]) => s + v, 0) / risks.length);
  const sortedRisks = [...risks].sort((a, b) => b[1] - a[1]);

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 14 }}>
          
          <Section title="OVERALL RISK SCORE">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 0" }}>
              <div style={{ position: "relative", width: 160, height: 80, overflow: "hidden" }}>
                <div style={{ width: 160, height: 160, borderRadius: "50%", border: "10px solid var(--border)", position: "absolute", top: 0 }} />
                <div style={{ 
                  width: 160, height: 160, borderRadius: "50%", 
                  border: `10px solid ${riskColor(overall)}`, 
                  position: "absolute", top: 0,
                  clipPath: `polygon(0 0, 100% 0, 100% 50%, 0 50%)`,
                  transform: `rotate(${(overall / 100) * 180 - 180}deg)`,
                  transition: "transform 1s ease-out"
                }} />
                <div style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center" }}>
                   <div style={{ color: riskColor(overall), fontSize: 28, fontWeight: 900, fontFamily: "var(--mono)" }}>{overall}</div>
                   <div style={{ color: "var(--muted)", fontSize: 8, fontFamily: "var(--mono)" }}>INDEX</div>
                </div>
              </div>
              <Badge color={overall > 60 ? "red" : overall > 40 ? "yellow" : "green"}>
                {overall > 60 ? "HIGH RISK" : overall > 40 ? "ELEVATED" : "LOW RISK"}
              </Badge>
            </div>
          </Section>

          <Section title="RISK RADAR BREAKDOWN">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {risks.map(([label, value]) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "var(--mono)", marginBottom: 4 }}>
                    <span style={{ color: "var(--muted)" }}>{label}</span>
                    <span style={{ color: riskColor(value), fontWeight: 700 }}>{value}</span>
                  </div>
                  <div style={{ height: 4, width: "100%", background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${value}%`, background: riskColor(value), transition: "width 0.8s ease-out" }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="TOP RISK FACTORS">
             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sortedRisks.slice(0, 5).map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--nav)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--muted-bright)", fontSize: 10, fontFamily: "var(--mono)" }}>{label}</span>
                    <Badge color={riskColor(value).includes("red") ? "red" : riskColor(value).includes("yellow") ? "yellow" : "green"}>
                       {value > 60 ? "CRITICAL" : "MONITOR"}
                    </Badge>
                  </div>
                ))}
             </div>
          </Section>

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
           <Section title="RISK DRIVERS">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                 {[
                   { l: "BRENT CRUDE", v: `$${brent.toFixed(2)}`, r: brent > 80 ? "HIGH" : "LOW" },
                   { l: "INDIA VIX", v: vix.toFixed(2), r: vix > 18 ? "HIGH" : "LOW" },
                   { l: "FII FLOWS", v: `₹${Math.abs(fiiNet).toLocaleString()} Cr`, r: fiiNet < 0 ? "OUTFLOW" : "INFLOW" },
                   { l: "USD/INR", v: `₹${usdInr.toFixed(2)}`, r: usdInr > 83 ? "WEAK" : "STABLE" },
                 ].map(d => (
                   <div key={d.l} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                      <span style={{ color: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)" }}>{d.l}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>{d.v}</div>
                        <div style={{ color: d.r.includes("HIGH") || d.r.includes("OUTFLOW") || d.r.includes("WEAK") ? "var(--red)" : "var(--green)", fontSize: 8, fontFamily: "var(--mono)" }}>{d.r}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </Section>

           <Section title="RISK ALERTS">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                 {(alertsData?.alerts || []).slice(0, 5).map((a, i) => (
                   <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.priority === "High" ? "var(--red)" : "var(--yellow)", marginTop: 4 }} />
                      <div>
                        <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 600, fontFamily: "var(--mono)" }}>{a.title}</div>
                        <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)", marginTop: 2 }}>{new Date(a.timestamp).toLocaleTimeString()}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </Section>

           <Section title="MITIGATION STRATEGY">
              <div style={{ background: "var(--nav)", border: "1px solid var(--border)", padding: 14, borderRadius: 8 }}>
                 <div style={{ color: "var(--blue)", fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)", marginBottom: 8 }}>DEFENSIVE BIAS</div>
                 <p style={{ color: "var(--muted-bright)", fontSize: 10, fontFamily: "var(--mono)", lineHeight: 1.6 }}>
                    Current risk levels suggest a capital preservation strategy. Higher VIX and FII outflows require tightening stop-losses and reducing exposure to high-beta sectors (Adani, Metals). Increase allocation to defensives (IT, FMCG) and cash.
                 </p>
              </div>
           </Section>
        </div>

      </div>
    </Layout>
  );
}
