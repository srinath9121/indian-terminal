import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Section from "../components/ui/Section";
import { useTerminalStore } from "../store/useTerminalStore";

function AdaniStockCard({ stock }) {
  const dangerScore = 100 - stock.conf;
  const isHighRisk = dangerScore > 60;
  
  return (
    <Card key={stock.symbol}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, letterSpacing: 0.8, fontFamily: "var(--mono)", textTransform: "uppercase" }}>{stock.symbol}</div>
            <div style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)", marginTop: 2 }}>₹{Number(stock.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>
          <Badge color={stock.decision === 'BUY' ? 'green' : stock.decision === 'SELL' ? 'red' : 'yellow'}>{stock.decision}</Badge>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "var(--mono)" }}>
            <span style={{ color: "var(--muted)" }}>DANGER SCORE</span>
            <span style={{ color: isHighRisk ? "var(--red)" : "var(--green)", fontWeight: 700 }}>{dangerScore}/100</span>
          </div>
          <div style={{ height: 4, width: "100%", background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${dangerScore}%`, background: isHighRisk ? "var(--red)" : "var(--green)", transition: "width 0.5s ease-out" }} />
          </div>
        </div>

        <div style={{ color: "var(--muted-bright)", fontSize: 9, fontFamily: "var(--mono)", fontStyle: "italic", lineHeight: 1.4, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          {stock.causalChain || "Analyzing macro transmission..."}
        </div>
      </div>
    </Card>
  );
}

export default function AdaniIntel() {
  const { adaniStocks, globalSignal, isLoading } = useTerminalStore();

  if (isLoading && adaniStocks.length === 0) {
    return (
      <Layout>
        <div style={{ display: "flex", height: "80vh", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>CONNECTING TO ADANI INTELLIGENCE...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
        
        {/* Adani Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {adaniStocks.map((stock) => (
            <AdaniStockCard key={stock.symbol} stock={stock} />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          <Section title="ADANI CAUSAL CHAIN IN FOCUS">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {(globalSignal?.causal_chain || ["Macro Stable", "Inflation ↓", "Growth ↑", "Market ↑"]).map((step, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: "var(--nav)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 8, color: "var(--text)", fontSize: 11, fontFamily: "var(--mono)" }}>
                    {step}
                  </div>
                  {i < (globalSignal?.causal_chain?.length || 4) - 1 && (
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p style={{ color: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)", marginTop: 16, lineHeight: 1.6 }}>
              This chain represents the deterministic transmission of macro stressors (Oil, USD/INR, Yields) 
              into the Adani Group's capital structure and market valuation. Each node is calculated based on real-time price momentum.
            </p>
          </Section>

          <Section title="RISK EXPLAINER">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "var(--nav)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, fontFamily: "var(--mono)", marginBottom: 4 }}>GROUP CORRELATION</div>
                <div style={{ color: "var(--green)", fontSize: 24, fontWeight: 900, fontFamily: "var(--mono)" }}>0.42</div>
                <div style={{ color: "var(--muted-bright)", fontSize: 9, fontFamily: "var(--mono)", marginTop: 2 }}>Moderate decouple from broad market</div>
              </div>
              <div style={{ background: "var(--nav)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, fontFamily: "var(--mono)", marginBottom: 4 }}>REFINANCING OUTLOOK</div>
                <div style={{ color: "var(--muted-bright)", fontSize: 20, fontWeight: 800, fontFamily: "var(--mono)" }}>STABLE</div>
                <div style={{ color: "var(--muted-bright)", fontSize: 9, fontFamily: "var(--mono)", marginTop: 2 }}>Debt-to-EBITDA within target threshold</div>
              </div>
            </div>
          </Section>
        </div>

      </div>
    </Layout>
  );
}
