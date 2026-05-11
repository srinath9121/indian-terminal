import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Section from '../components/ui/Section';
import Sparkline from "../components/charts/Sparkline";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useTerminalStore } from '../store/useTerminalStore';

const MacroMetric = ({ title, value, subValue, status }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, letterSpacing: 0.8, fontFamily: "var(--mono)", textTransform: "uppercase" }}>{title}</div>
    <div style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, fontFamily: "var(--mono)" }}>{value}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
      <span style={{ color: "var(--muted-bright)", fontSize: 9, fontFamily: "var(--mono)" }}>{subValue}</span>
      <Badge color={status === 'Strong' ? 'green' : status === 'Rising' ? 'red' : 'yellow'}>{status}</Badge>
    </div>
  </div>
);

export default function Macro() {
  const { macroData, globalSignal } = useTerminalStore();

  const metrics = [
    { title: "GDP GROWTH (YoY)", value: macroData?.gdp?.value ? `${macroData.gdp.value}%` : "6.8%", sub: "Q4 FY24", status: macroData?.gdp?.status || "Strong" },
    { title: "CPI INFLATION", value: macroData?.inflation?.value ? `${macroData.inflation.value}%` : "5.1%", sub: "Apr 2024", status: macroData?.inflation?.status || "Rising" },
    { title: "RBI REPO RATE", value: macroData?.rbi_rate || "6.50%", sub: "Current Rate", status: "NEUTRAL" },
    { title: "IIP GROWTH", value: "3.2%", sub: "Mar 2024", status: "Strong" },
    { title: "FISCAL DEFICIT", value: "5.6%", sub: "FY24 YTD", status: "DEFENSIVE" },
    { title: "BRENT CRUDE", value: macroData?.brent_crude?.price || "$85.12", sub: "Global Bench", status: "Rising" },
  ];

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
        
        {/* Macro Scoreboard */}
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 20 }}>
            <div style={{ gridColumn: "span 9" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {metrics.map(m => (
                  <MacroMetric key={m.title} title={m.title} value={m.value} subValue={m.sub} status={m.status} />
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "span 3", borderLeft: "1px solid var(--border)", paddingLeft: 20, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, fontFamily: "var(--mono)", marginBottom: 8 }}>MACRO SENTIMENT</div>
              <div style={{ color: "var(--yellow)", fontSize: 24, fontWeight: 900, fontFamily: "var(--mono)" }}>NEUTRAL</div>
              <div style={{ color: "var(--muted-bright)", fontSize: 10, fontFamily: "var(--mono)", marginTop: 4 }}>Score: 52/100</div>
            </div>
          </div>
        </Card>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <Section title="INFLATION TREND (YoY %)">
            <div style={{ height: 160, width: "100%", marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{n: 'May', v: 7}, {n: 'Jul', v: 6.5}, {n: 'Sep', v: 6.8}, {n: 'Nov', v: 5.5}, {n: 'Jan', v: 5.1}, {n: 'Mar', v: 4.8}]}>
                  <Line type="monotone" dataKey="v" stroke="var(--red)" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', fontSize: '10px' }} />
                  <XAxis dataKey="n" hide />
                  <YAxis hide domain={[0, 10]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="RBI POLICY RATE TREND (%)">
            <div style={{ height: 160, width: "100%", marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{n: 'May 23', v: 4}, {n: 'Jul 23', v: 5}, {n: 'Sep 23', v: 6.5}, {n: 'Nov 23', v: 6.5}, {n: 'Jan 24', v: 6.5}, {n: 'May 24', v: 6.5}]}>
                  <Line type="stepAfter" dataKey="v" stroke="var(--blue)" strokeWidth={2} dot={false} />
                  <XAxis dataKey="n" hide />
                  <YAxis hide domain={[0, 8]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="FOREIGN EXCHANGE SNAPSHOT">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {[
                { pair: 'USD / INR', val: macroData?.usd_inr?.price || '83.24', chg: macroData?.usd_inr?.change || '0.15', pct: macroData?.usd_inr?.pct_change || '0.18%', up: true },
                { pair: 'EUR / INR', val: '90.12', chg: '0.32', pct: '0.35%', up: true },
                { pair: 'GBP / INR', val: '105.42', chg: '-0.28', pct: '-0.27%', up: false }
              ].map(fx => (
                <div key={fx.pair} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                  <span style={{ color: "var(--muted)", fontSize: 10, fontFamily: "var(--mono)" }}>{fx.pair}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "var(--text)", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>{fx.val}</div>
                    <div style={{ color: fx.up ? "var(--green)" : "var(--red)", fontSize: 9, fontFamily: "var(--mono)" }}>{fx.up ? '▲' : '▼'} {fx.chg} ({fx.pct})</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <Section title="LIQUIDITY CONDITIONS">
            <div style={{ height: 100, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: 1, v: 10}, {n: 2, v: 15}, {n: 3, v: 12}, {n: 4, v: 25}, {n: 5, v: 20}]}>
                  <Area type="monotone" dataKey="v" stroke="var(--green)" fill="rgba(34, 197, 94, 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "var(--mono)" }}>SYSTEM LIQUIDITY</div>
                <div style={{ color: "var(--green)", fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)" }}>₹1,62,345 Cr</div>
              </div>
              <Badge color="green">Surplus</Badge>
            </div>
          </Section>

          <Section title="BOND YIELDS (%)">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--muted)", fontSize: 9, borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ paddingBottom: 8, fontWeight: 500 }}>TENOR</th>
                  <th style={{ paddingBottom: 8, fontWeight: 500, textAlign: "right" }}>CURRENT</th>
                  <th style={{ paddingBottom: 8, fontWeight: 500, textAlign: "right" }}>CHG</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { t: '3M', c: '6.52', ch: '+2 bps', up: true },
                  { t: '1Y', c: '6.63', ch: '+2 bps', up: true },
                  { t: '10Y', c: '7.12', ch: '+6 bps', up: true }
                ].map(bond => (
                  <tr key={bond.t} style={{ borderBottom: "1px solid var(--border)", fontSize: 10 }}>
                    <td style={{ padding: "8px 0", color: "var(--muted-bright)", fontFamily: "var(--mono)" }}>{bond.t}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "var(--text)", fontWeight: 700, fontFamily: "var(--mono)" }}>{bond.c}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: bond.up ? "var(--green)" : "var(--red)", fontFamily: "var(--mono)" }}>{bond.ch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="MACRO CALENDAR">
             <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { date: 'MAY 27', event: 'GDP GROWTH (Q4)', loc: 'IN' },
                  { date: 'MAY 29', event: 'RBI POLICY MEET', loc: 'IN' },
                  { date: 'JUN 03', event: 'MFG PMI (MAY)', loc: 'IN' },
                  { date: 'JUN 05', event: 'US PAYROLLS', loc: 'US' }
                ].map(item => (
                  <div key={item.event} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 9, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--blue)", width: 40, fontFamily: "var(--mono)" }}>{item.date}</span>
                    <span style={{ color: "var(--text)", flex: 1, fontWeight: 600, paddingLeft: 10, fontFamily: "var(--mono)" }}>{item.event}</span>
                    <span style={{ color: "var(--muted)", fontWeight: 700, fontFamily: "var(--mono)" }}>{item.loc}</span>
                  </div>
                ))}
             </div>
          </Section>
        </div>
      </div>
    </Layout>
  );
}
