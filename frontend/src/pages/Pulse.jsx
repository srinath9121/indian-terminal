import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Badge from "../components/ui/Badge";
import Sparkline from "../components/charts/Sparkline";
import Globe from "../components/globe/Globe";
import HomepageGlobe from "../components/globe/HomepageGlobe";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { useTerminalStore } from "../store/useTerminalStore";

function ScoreCard({ title, label, labelColor, value, sub, sparkData, sparkColor }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", flex: 1, minWidth: 0 }}>
      <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "var(--mono)", marginBottom: 4 }}>{title}</div>
      <div style={{ color: labelColor || "var(--green)", fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)" }}>{label}</div>
      {value && <div style={{ color: "var(--muted-bright)", fontSize: 10, marginTop: 2, fontFamily: "var(--mono)" }}>{value}</div>}
      {sub && <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)" }}>{sub}</div>}
      <div style={{ marginTop: 6 }}><Sparkline color={sparkColor || "var(--green)"} points={sparkData || [3,5,4,6,5,7,6]} height={28} width={80} /></div>
    </div>
  );
}

function MarketBiasCard({ state, confidence }) {
  const color = state === "BULLISH" ? "var(--green)" : state === "DEFENSIVE" ? "var(--red)" : "var(--yellow)";
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 18px", flex: 1, minWidth: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "var(--mono)" }}>MARKET BIAS</div>
      <div style={{ color, fontSize: 22, fontWeight: 900, fontFamily: "var(--mono)", letterSpacing: 1 }}>{state || "CALCULATING"}</div>
      <div style={{ color: "var(--muted-bright)", fontSize: 10, fontFamily: "var(--mono)" }}>Confidence: {confidence ?? 0}%</div>
    </div>
  );
}

function AdaniCard({ ticker, price, change, signal, conf }) {
  const isNeg = change < 0;
  const sc = { DEFENSIVE: "var(--red)", NEUTRAL: "var(--yellow)", BULLISH: "var(--green)" };
  const sColor = sc[signal] || "var(--muted)";
  return (
    <div style={{ background: "var(--card-alt)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", flex: 1, minWidth: 120 }}>
      <div style={{ color: "var(--muted-bright)", fontSize: 9, fontWeight: 700, letterSpacing: 0.8, fontFamily: "var(--mono)" }}>{ticker}</div>
      <div style={{ color: "var(--text)", fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)", marginTop: 2 }}>₹{Number(price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      <div style={{ color: isNeg ? "var(--red)" : "var(--green)", fontSize: 10, fontFamily: "var(--mono)" }}>{isNeg ? "" : "+"}{change}%</div>
      <Sparkline color={isNeg ? "var(--red)" : "var(--green)"} points={isNeg ? [9,8,7,6,7,5,4] : [4,5,6,5,6,7,6]} height={28} width={90} />
      <div style={{ background: `${sColor}22`, color: sColor, border: `1px solid ${sColor}55`, borderRadius: 4, fontSize: 9, fontWeight: 700, textAlign: "center", padding: "2px 0", marginTop: 4, fontFamily: "var(--mono)" }}>{signal}</div>
      <div style={{ color: "var(--muted)", fontSize: 9, textAlign: "center", marginTop: 2, fontFamily: "var(--mono)" }}>Conf: {conf}%</div>
    </div>
  );
}

export default function Pulse() {
  const navigate = useNavigate();
  const { marketData, macroData, adaniStocks, globalSignal, alertsData, isLoading } = useTerminalStore();

  if (isLoading && !marketData) {
    return <Layout><div style={{ display: "flex", height: "80vh", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>CONNECTING TO TERMINAL...</div></Layout>;
  }

  const fiiNet = marketData?.fii_flows?.net_value ?? -3247;
  const fiiTrend = marketData?.fii_flows?.trend ?? "outflow";
  const gdp = macroData?.gdp ?? {};
  const inflation = macroData?.inflation ?? {};
  const liquidity = macroData?.liquidity ?? {};
  const signalState = globalSignal?.state || "NEUTRAL";
  const signalConf = globalSignal?.confidence ?? 50;
  const causalChain = globalSignal?.causal_chain || ["Macro Stable", "Inflation ↓", "RBI Pause", "Growth ↑", "Market ↑"];

  const stocks = (adaniStocks || []).slice(0, 5);
  const liveAlerts = alertsData?.alerts?.slice(0, 3) || [
    { title: "Correlation Spike Detected", description: "Adani group correlation above 0.85", priority: "High", timestamp: new Date().toISOString() },
    { title: "FII Outflow Continues", description: "Net FII selling 3rd day", priority: "Medium", timestamp: new Date().toISOString() },
    { title: "Oil Price Surge", description: "Brent crude above $85/barrel", priority: "High", timestamp: new Date().toISOString() },
  ];
  const whatChanged = [
    { icon: "🔴", text: "FII turned net sellers after 5 weeks" },
    { icon: "🔴", text: "Brent crude crossed $85/barrel" },
    { icon: "🔴", text: "RBI commentary turned slightly hawkish" },
    { icon: "🟢", text: "India CPI came in higher than expected" },
    { icon: "🟢", text: "US 10Y bond yield moved above 4.6%" },
  ];

  const marketCards = [
    { label: "NIFTY 50", val: marketData?.nifty?.price, chg: marketData?.nifty?.change, pct: marketData?.nifty?.pct_change, up: (marketData?.nifty?.pct_change ?? 0) >= 0 },
    { label: "SENSEX", val: marketData?.sensex?.price, chg: marketData?.sensex?.change, pct: marketData?.sensex?.pct_change, up: (marketData?.sensex?.pct_change ?? 0) >= 0 },
    { label: "NIFTY BANK", val: marketData?.bank_nifty?.price, chg: marketData?.bank_nifty?.change, pct: marketData?.bank_nifty?.pct_change, up: (marketData?.bank_nifty?.pct_change ?? 0) >= 0 },
    { label: "INDIA VIX", val: marketData?.vix?.price, chg: marketData?.vix?.change, pct: marketData?.vix?.pct_change, up: (marketData?.vix?.pct_change ?? 0) >= 0 },
  ];

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">

        {/* Row 1: Scoreboard + Globe */}
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--text)", fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: "var(--mono)" }}>INDIA MACRO SCOREBOARD</span>
              <Badge color="green">LIVE</Badge>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <ScoreCard title="GROWTH" label={gdp.status || "Strong"} labelColor="var(--green)" value={gdp.value ? `${gdp.value}% GDP Forecast` : "6.8% GDP Forecast"} sparkData={[3,4,5,4,6,5,7]} sparkColor="var(--green)" />
              <ScoreCard title="INFLATION" label={inflation.status || "Rising"} labelColor="var(--red)" value={inflation.value ? `${inflation.value}% CPI YoY` : "5.1% CPI YoY"} sparkData={[4,5,5,6,6,7,7]} sparkColor="var(--red)" />
              <ScoreCard title="LIQUIDITY" label={liquidity.status || "Tightening"} labelColor="var(--yellow)" sub="System Liquidity" sparkData={[6,5,5,4,4,3,3]} sparkColor="var(--yellow)" />
              <ScoreCard title="FII FLOW" label={fiiTrend === "outflow" ? "Negative" : "Positive"} labelColor={fiiTrend === "outflow" ? "var(--red)" : "var(--green)"} value={`₹${fiiNet.toLocaleString()} Cr`} sub="Net Institutional" sparkData={fiiTrend === "outflow" ? [5,4,4,3,4,3,2] : [2,3,4,3,5,4,6]} sparkColor={fiiTrend === "outflow" ? "var(--red)" : "var(--green)"} />
              <MarketBiasCard state={signalState} confidence={signalConf} />
            </div>
          </div>

          {/* Globe Section */}
          <div style={{ flex: 1 }}>
            <ErrorBoundary>
              <HomepageGlobe />
            </ErrorBoundary>
          </div>
        </div>

        {/* Row 2: What Changed + Adani + Alerts */}
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: "0 0 220px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", marginBottom: 2 }}>WHAT CHANGED THIS WEEK?</div>
            <div style={{ color: "#475569", fontSize: 9, fontFamily: "var(--mono)", marginBottom: 10 }}>Updated: Today</div>
            {whatChanged.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ fontSize: 10 }}>{it.icon}</span>
                <span style={{ color: "var(--muted-bright)", fontSize: 10, fontFamily: "var(--mono)" }}>{it.text}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>ADANI GROUP SIGNALS</span>
              <button onClick={() => navigate("/adani-intel")} style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 10, cursor: "pointer", fontFamily: "var(--mono)" }}>View All</button>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {stocks.map(s => (
                <AdaniCard key={s.symbol} ticker={s.symbol} price={s.price} change={s.pct_change} signal={s.conf > 60 ? "BULLISH" : s.conf < 50 ? "DEFENSIVE" : "NEUTRAL"} conf={s.conf} />
              ))}
            </div>
          </div>

          <div style={{ flex: "0 0 300px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>LIVE ALERTS</div>
              <button onClick={() => navigate("/alerts")} style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 10, cursor: "pointer", fontFamily: "var(--mono)" }}>View All</button>
            </div>
            {liveAlerts.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, paddingBottom: 10, borderBottom: i < liveAlerts.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{a.priority === "High" ? "🔴" : "🟡"}</span>
                  <div>
                    <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 600, fontFamily: "var(--mono)" }}>{a.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)" }}>{a.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Market Snapshot + AI Summary + Causal Chain */}
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: "0 0 36%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>MARKET SNAPSHOT</div>
              <div style={{ color: "var(--green)", fontSize: 9, fontFamily: "var(--mono)" }}>Updated: Live</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {marketCards.map(c => (
                <div key={c.label} style={{ flex: 1, background: "var(--nav)", borderRadius: 6, padding: "10px" }}>
                  <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)" }}>{c.label}</div>
                  <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", margin: "4px 0" }}>{c.val ? Number(c.val).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "--"}</div>
                  <div style={{ color: c.up ? "var(--green)" : "var(--red)", fontSize: 9, fontFamily: "var(--mono)" }}>{c.up ? "▲" : "▼"} {c.chg ?? 0} ({c.pct ?? 0}%)</div>
                  <Sparkline color={c.up ? "var(--green)" : "var(--red)"} points={c.up ? [3,4,3,5,4,6,5] : [6,5,6,4,5,3,4]} height={24} width={70} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: "0 0 28%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>AI SUMMARY</span>
                <Badge color="blue">BETA</Badge>
              </div>
            </div>
            <p style={{ color: "var(--muted-bright)", fontSize: 11, lineHeight: 1.6, fontFamily: "var(--mono)", margin: "0 0 10px 0" }}>
              {globalSignal?.reasons?.length > 0
                ? globalSignal.reasons.join(". ") + "."
                : "The market remains under pressure with high correlation across the Adani group, weak flows, and a defensive macro backdrop. Short-term bias remains cautious."}
            </p>
          </div>

          <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
            <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", marginBottom: 12 }}>CAUSAL CHAIN IN FOCUS</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              {causalChain.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ background: "var(--nav)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", textAlign: "center", minWidth: 70 }}>
                    <div style={{ color: "var(--muted-bright)", fontSize: 8, fontFamily: "var(--mono)", lineHeight: 1.3 }}>{step}</div>
                  </div>
                  {i < causalChain.length - 1 && <span style={{ color: "#475569", fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ticker Strip */}
        <div style={{ background: "var(--bg-darker)", borderTop: "1px solid var(--border)", padding: "6px 20px", display: "flex", gap: 32, alignItems: "center", overflowX: "auto", margin: "0 -20px", paddingLeft: 20 }}>
          <span style={{ color: "#475569", fontSize: 9, fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: 1, flexShrink: 0 }}>LIVE MARKET TICKER</span>
          {[
            { l: "NIFTY", v: marketData?.nifty?.price, c: marketData?.nifty?.change, p: marketData?.nifty?.pct_change },
            { l: "SENSEX", v: marketData?.sensex?.price, c: marketData?.sensex?.change, p: marketData?.sensex?.pct_change },
            { l: "BANKNIFTY", v: marketData?.bank_nifty?.price, c: marketData?.bank_nifty?.change, p: marketData?.bank_nifty?.pct_change },
            { l: "USD/INR", v: macroData?.usd_inr?.price, c: macroData?.usd_inr?.change, p: macroData?.usd_inr?.pct_change },
            { l: "CRUDE", v: macroData?.brent_crude?.price, c: macroData?.brent_crude?.change, p: macroData?.brent_crude?.pct_change },
          ].map(it => {
            const up = (it.p ?? 0) >= 0;
            return (
              <div key={it.l} style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                <span style={{ color: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)" }}>{it.l}</span>
                <span style={{ color: "var(--text)", fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)" }}>{it.v ?? "--"}</span>
                <span style={{ color: up ? "var(--green)" : "var(--red)", fontSize: 10, fontFamily: "var(--mono)" }}>{up ? "▲" : "▼"} {it.c ?? 0} ({it.p ?? 0}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
