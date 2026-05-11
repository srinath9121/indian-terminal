import { useState } from "react";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Section from "../components/ui/Section";
import Badge from "../components/ui/Badge";
import { useTerminalStore } from "../store/useTerminalStore";

const PRIORITY_META = {
  High:   { color: "red",    dot: "#ef4444", label: "HIGH" },
  Medium: { color: "yellow", dot: "#f59e0b", label: "MED"  },
  Low:    { color: "green",  dot: "#22c55e", label: "LOW"  },
};

const CATEGORIES = ["All", "Macro", "Market", "Commodities", "FII/DII", "Risk"];

export default function Alerts() {
  const { alertsData, isLoading } = useTerminalStore();
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const rawAlerts = alertsData?.alerts || [];
  const filtered = rawAlerts.filter((a) => {
    const pMatch = priorityFilter === "All" || a.priority === priorityFilter;
    const cMatch = categoryFilter === "All" || a.category === categoryFilter;
    return pMatch && cMatch;
  });

  const high   = alertsData?.high_count   ?? rawAlerts.filter((a) => a.priority === "High").length;
  const medium = alertsData?.medium_count ?? rawAlerts.filter((a) => a.priority === "Medium").length;
  const low    = alertsData?.low_count    ?? rawAlerts.filter((a) => a.priority === "Low").length;
  const total  = alertsData?.total        ?? rawAlerts.length;

  const highPct   = total > 0 ? (high   / total) * 100 : 0;
  const mediumPct = total > 0 ? (medium / total) * 100 : 0;
  const donutBg   = `conic-gradient(
    #ef4444 0% ${highPct}%,
    #f59e0b ${highPct}% ${highPct + mediumPct}%,
    #22c55e ${highPct + mediumPct}% 100%
  )`;

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "HIGH PRIORITY", val: high,   color: "var(--red)" },
            { label: "MEDIUM PRIORITY", val: medium, color: "var(--yellow)" },
            { label: "LOW PRIORITY", val: low,    color: "var(--green)" },
            { label: "TOTAL ALERTS", val: total,  color: "var(--blue)" },
          ].map(s => (
            <Card key={s.label}>
              <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "var(--mono)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: "var(--text)", fontSize: 24, fontWeight: 700, fontFamily: "var(--mono)" }}>{s.val}</div>
              <div style={{ marginTop: 6 }}><Badge color={s.color.includes("red") ? "red" : s.color.includes("yellow") ? "yellow" : s.color.includes("green") ? "green" : "blue"}>ACTIVE</Badge></div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 300px", gap: 14 }}>
          
          <Section title="FILTER">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, marginBottom: 8 }}>PRIORITY</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {["All", "High", "Medium", "Low"].map(p => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      style={{
                        background: priorityFilter === p ? "var(--nav)" : "transparent",
                        border: `1px solid ${priorityFilter === p ? "var(--muted)" : "var(--border)"}`,
                        color: priorityFilter === p ? "var(--text)" : "var(--muted)",
                        padding: "6px 10px",
                        borderRadius: 4,
                        fontSize: 10,
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "var(--mono)"
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, marginBottom: 8 }}>CATEGORY</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      style={{
                        background: categoryFilter === c ? "var(--nav)" : "transparent",
                        border: `1px solid ${categoryFilter === c ? "var(--muted)" : "var(--border)"}`,
                        color: categoryFilter === c ? "var(--text)" : "var(--muted)",
                        padding: "6px 10px",
                        borderRadius: 4,
                        fontSize: 10,
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "var(--mono)"
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title={`LIVE ALERTS ${isLoading ? "(POLLING...)" : ""}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}>NO ALERTS MATCHING FILTERS</div>
              ) : (
                filtered.map(a => {
                  const meta = PRIORITY_META[a.priority] || PRIORITY_META.Low;
                  return (
                    <div key={a.id} style={{ background: "var(--nav)", border: "1px solid var(--border)", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.dot, marginTop: 4, boxShadow: `0 0 8px ${meta.dot}` }} />
                        <div>
                          <div style={{ color: "var(--text)", fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)" }}>{a.title}</div>
                          <div style={{ color: "var(--muted-bright)", fontSize: 10, marginTop: 2, fontFamily: "var(--mono)" }}>{a.description}</div>
                          <div style={{ color: "var(--muted)", fontSize: 9, marginTop: 6, fontFamily: "var(--mono)", textTransform: "uppercase" }}>{a.category}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Badge color={meta.color}>{meta.label}</Badge>
                        <div style={{ color: "var(--muted)", fontSize: 9, marginTop: 8, fontFamily: "var(--mono)" }}>{new Date(a.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Section>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Section title="DISTRIBUTION">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", width: 140, height: 140, borderRadius: "50%", background: donutBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "var(--text)", fontSize: 24, fontWeight: 900, fontFamily: "var(--mono)" }}>{total}</div>
                    <div style={{ color: "var(--muted)", fontSize: 8, fontFamily: "var(--mono)" }}>TOTAL</div>
                  </div>
                </div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[["High", high, "var(--red)"], ["Medium", medium, "var(--yellow)"], ["Low", low, "var(--green)"]].map(([l, c, col]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontFamily: "var(--mono)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
                        <span style={{ color: "var(--muted)" }}>{l}</span>
                      </div>
                      <span style={{ color: "var(--text)", fontWeight: 700 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>

        </div>
      </div>
    </Layout>
  );
}
