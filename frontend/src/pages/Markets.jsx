import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Section from "../components/ui/Section";
import Sparkline from "../components/charts/Sparkline";
import { useTerminalStore } from "../store/useTerminalStore";

function MarketRow({ label, value, change, pct, up }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ color: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)" }}>{label}</div>
      <div style={{ color: "var(--text)", fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)" }}>{value}</div>
      <div style={{ color: up ? "var(--green)" : "var(--red)", fontSize: 10, fontFamily: "var(--mono)" }}>
        {up ? "▲" : "▼"} {change} ({pct}%)
      </div>
    </div>
  );
}

export default function Markets() {
  const { marketData, isLoading } = useTerminalStore();

  const indices = [
    { label: "NIFTY 50", data: marketData?.nifty },
    { label: "SENSEX", data: marketData?.sensex },
    { label: "BANKNIFTY", data: marketData?.bank_nifty },
    { label: "INDIA VIX", data: marketData?.vix },
    { label: "NIFTY NEXT 50", data: marketData?.nifty_next_50 || { price: "--", change: "0", pct_change: "0" } },
  ];

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
        
        {/* Top Bar: Primary Indices */}
        <div style={{ display: "flex", gap: 10 }}>
          {indices.map((idx) => {
            const up = (idx.data?.pct_change ?? 0) >= 0;
            return (
              <Card key={idx.label} style={{ flex: 1 }}>
                <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "var(--mono)", marginBottom: 4 }}>{idx.label}</div>
                <div style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, fontFamily: "var(--mono)" }}>{idx.data?.price || "--"}</div>
                <div style={{ color: up ? "var(--green)" : "var(--red)", fontSize: 10, fontFamily: "var(--mono)", marginTop: 2 }}>
                  {up ? "▲" : "▼"} {idx.data?.change ?? 0} ({idx.data?.pct_change ?? 0}%)
                </div>
                <div style={{ marginTop: 8 }}>
                  <Sparkline color={up ? "var(--green)" : "var(--red)"} points={up ? [3,4,3,5,4,6,5] : [6,5,6,4,5,3,4]} height={24} width={80} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          
          <Section title="SECTOR PERFORMANCE">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "NIFTY IT", val: "+1.42%", up: true },
                { label: "NIFTY FMCG", val: "+1.18%", up: true },
                { label: "NIFTY BANK", val: "+0.83%", up: true },
                { label: "NIFTY AUTO", val: "+0.55%", up: true },
                { label: "NIFTY METAL", val: "-0.24%", up: false },
                { label: "NIFTY PHARMA", val: "+0.12%", up: true },
              ].map(s => (
                <MarketRow key={s.label} label={s.label} value={s.val} up={s.up} />
              ))}
            </div>
          </Section>

          <Section title="TOP GAINERS">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "TATATECH", val: "1,142.50", chg: "+45.20", pct: "4.12", up: true },
                { label: "INFY", val: "1,542.10", chg: "+32.10", pct: "2.12", up: true },
                { label: "HCLTECH", val: "1,341.50", chg: "+24.30", pct: "1.84", up: true },
                { label: "WIPRO", val: "482.40", chg: "+8.20", pct: "1.72", up: true },
                { label: "TCS", val: "3,842.00", chg: "+42.00", pct: "1.10", up: true },
              ].map(s => (
                <MarketRow key={s.label} label={s.label} value={s.val} change={s.chg} pct={s.pct} up={s.up} />
              ))}
            </div>
          </Section>

          <Section title="TOP LOSERS">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "M&M", val: "1,942.50", chg: "-42.10", pct: "-2.12", up: false },
                { label: "ADANIPORTS", val: "1,341.10", chg: "-12.50", pct: "-0.92", up: false },
                { label: "JSWSTEEL", val: "842.40", chg: "-8.20", pct: "-0.96", up: false },
                { label: "BPCL", val: "612.30", chg: "-4.20", pct: "-0.68", up: false },
                { label: "TITAN", val: "3,242.00", chg: "-18.00", pct: "-0.55", up: false },
              ].map(s => (
                <MarketRow key={s.label} label={s.label} value={s.val} change={s.chg} pct={s.pct} up={s.up} />
              ))}
            </div>
          </Section>

          <Section title="FII / DII ACTIVITY">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: "var(--nav)", padding: 12, borderRadius: 6 }}>
                <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)", marginBottom: 4 }}>FII CASH NET</div>
                <div style={{ color: "var(--red)", fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)" }}>-₹2,345.12 Cr</div>
              </div>
              <div style={{ background: "var(--nav)", padding: 12, borderRadius: 6 }}>
                <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)", marginBottom: 4 }}>DII CASH NET</div>
                <div style={{ color: "var(--green)", fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)" }}>+₹3,862.45 Cr</div>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)", marginTop: 4 }}>Last updated: 15:30 IST</div>
            </div>
          </Section>

          <Section title="DERIVATIVES SNAPSHOT">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "NIFTY PCR", val: "0.84", up: false },
                { label: "BANKNIFTY PCR", val: "0.72", up: false },
                { label: "MAX PAIN", val: "24,000", up: true },
                { label: "VOLATILITY SKEW", val: "Stable", up: true },
              ].map(d => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "4px 0" }}>
                  <span style={{ color: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)" }}>{d.label}</span>
                  <span style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>{d.val}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="GLOBAL INDICES">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "S&P 500", val: "5,342.12", pct: "+0.42", up: true },
                { label: "NASDAQ", val: "16,842.45", pct: "+0.85", up: true },
                { label: "DOW JONES", val: "39,142.10", pct: "+0.12", up: true },
                { label: "DAX", val: "18,442.12", pct: "-0.24", up: false },
                { label: "NIKKEI 225", val: "38,842.10", pct: "-0.15", up: false },
              ].map(s => (
                <MarketRow key={s.label} label={s.label} value={s.val} pct={s.pct} up={s.up} />
              ))}
            </div>
          </Section>

        </div>
      </div>
    </Layout>
  );
}
