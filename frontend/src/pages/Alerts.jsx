import { useState } from "react";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Section from "../components/ui/Section";
import Badge from "../components/ui/Badge";
import { useTerminalStore } from "../store/useTerminalStore";

const PRIORITY_META = {
  High:   { badge: "defensive", dot: "#ef4444", label: "HIGH" },
  Medium: { badge: "neutral",   dot: "#f59e0b", label: "MED"  },
  Low:    { badge: "bullish",   dot: "#22c55e", label: "LOW"  },
};

const CATEGORIES = ["All", "Macro", "Market", "Commodities", "FII/DII", "Risk"];

const FALLBACK_ALERTS = [
  { id: "F1", title: "Crude Oil Prices Surge Above $85/barrel", description: "Brent at $85.1/barrel — import bill pressure rising", category: "Commodities", priority: "High",   timestamp: new Date().toISOString() },
  { id: "F2", title: "RBI Maintains Repo Rate at 6.50%",         description: "Policy stance unchanged — liquidity remains tight", category: "Macro",       priority: "High",   timestamp: new Date().toISOString() },
  { id: "F3", title: "FII Net Selling Continues",                 description: "Net FII outflow ₹3,247 Cr today",                   category: "Market",      priority: "High",   timestamp: new Date().toISOString() },
  { id: "F4", title: "Nifty 50 Breaks Below Support",            description: "Broad sell-off detected — monitor next levels",     category: "Market",      priority: "Medium", timestamp: new Date().toISOString() },
];

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--";
  }
}

export default function Alerts() {
  const { alertsData, isLoading } = useTerminalStore();
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const rawAlerts = alertsData?.alerts?.length > 0 ? alertsData.alerts : FALLBACK_ALERTS;

  const filtered = rawAlerts.filter((a) => {
    const pMatch = priorityFilter === "All" || a.priority === priorityFilter;
    const cMatch = categoryFilter === "All" || a.category === categoryFilter;
    return pMatch && cMatch;
  });

  const high   = alertsData?.high_count   ?? rawAlerts.filter((a) => a.priority === "High").length;
  const medium = alertsData?.medium_count ?? rawAlerts.filter((a) => a.priority === "Medium").length;
  const low    = alertsData?.low_count    ?? rawAlerts.filter((a) => a.priority === "Low").length;
  const total  = alertsData?.total        ?? rawAlerts.length;

  // Donut chart using conic-gradient
  const highPct   = total > 0 ? (high   / total) * 100 : 0;
  const mediumPct = total > 0 ? (medium / total) * 100 : 0;
  const donutBg   = `conic-gradient(
    #ef4444 0% ${highPct}%,
    #f59e0b ${highPct}% ${highPct + mediumPct}%,
    #22c55e ${highPct + mediumPct}% 100%
  )`;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <Grid cols={4}>
          {[
            ["High Priority",   high,   "defensive"],
            ["Medium Priority", medium, "neutral"],
            ["Low Priority",    low,    "bullish"],
            ["Total Alerts",    total,  "neutral"],
          ].map(([label, value, tone]) => (
            <Card key={label}>
              <div className="text-xs uppercase tracking-[0.1em] text-[var(--muted)]">{label}</div>
              <div className="mt-2 text-3xl font-bold text-white">{value}</div>
              <div className="mt-3">
                <Badge tone={tone}>{label.split(" ")[0]}</Badge>
              </div>
            </Card>
          ))}
        </Grid>

        {/* ── Main Panel ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.75fr_1.7fr_0.9fr]">

          {/* Filter Panel */}
          <Section title="FILTER ALERTS">
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">Priority</div>
                <div className="flex flex-col gap-1.5">
                  {["All", "High", "Medium", "Low"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${
                        priorityFilter === p
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {p === "High"   && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />}
                      {p === "Medium" && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />}
                      {p === "Low"    && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />}
                      {p === "All"    && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--muted)]" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">Category</div>
                <div className="flex flex-col gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${
                        categoryFilter === c
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Alert List */}
          <Section title={`ALL ALERTS${isLoading ? "  ·  LOADING..." : `  ·  ${filtered.length} shown`}`}>
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-xs text-[var(--muted)]">
                  No alerts match the selected filters.
                </div>
              ) : (
                filtered.map((a) => {
                  const meta = PRIORITY_META[a.priority] ?? PRIORITY_META.Low;
                  return (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[#0d1320]/60 p-3 transition-all hover:border-white/20 hover:bg-[#0f1622]"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: meta.dot }}
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{a.title}</div>
                          {a.description && (
                            <div className="mt-0.5 text-xs text-[var(--muted)]">{a.description}</div>
                          )}
                          <div className="mt-1 text-xs text-[var(--muted)] opacity-60">{a.category}</div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-2">
                        <Badge tone={meta.badge}>{meta.label}</Badge>
                        <div className="text-xs text-[var(--muted)]">{formatTime(a.timestamp)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Section>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Donut Summary */}
            <Section title="ALERT SUMMARY">
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-[160px] w-[160px] items-center justify-center">
                  <div className="h-full w-full rounded-full" style={{ background: donutBg }} />
                  <div className="absolute h-[108px] w-[108px] rounded-full bg-[#0b1019]" />
                  <div className="absolute flex flex-col items-center">
                    <div className="text-2xl font-bold text-white">{total}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">alerts</div>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 text-xs">
                  {[["High", high, "#ef4444"], ["Medium", medium, "#f59e0b"], ["Low", low, "#22c55e"]].map(
                    ([label, count, color]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-[var(--muted)]">{label}</span>
                        </div>
                        <span className="font-semibold text-white">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </Section>

            {/* Recently Triggered */}
            <Section title="RECENTLY TRIGGERED">
              <div className="space-y-3">
                {rawAlerts.slice(0, 5).map((a) => {
                  const dot = PRIORITY_META[a.priority]?.dot ?? "#888";
                  return (
                    <div key={a.id} className="border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: dot }}
                        />
                        <div className="text-xs leading-4 text-[var(--muted)]">{a.title}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
