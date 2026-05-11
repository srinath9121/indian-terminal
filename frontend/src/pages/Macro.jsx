import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Grid from '../components/ui/Grid';
import Badge from '../components/ui/Badge';
import Section from '../components/ui/Section';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- Sub-components for Macro Page ---

const MacroMetric = ({ title, value, subValue, trend, status }) => (
  <div className="flex flex-col gap-1">
    <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{title}</div>
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--muted)]">{subValue}</span>
      <Badge tone={status === 'Strong' ? 'bullish' : status === 'Rising' ? 'defensive' : 'neutral'}>{status}</Badge>
    </div>
  </div>
);

export default function Macro() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* 1. Macro Overview */}
      <Card>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
             <Grid cols={6} gap={4}>
                <MacroMetric title="GDP GROWTH (YoY)" value="6.8%" subValue="Q4 FY24" status="Strong" />
                <MacroMetric title="CPI INFLATION (YoY)" value="5.1%" subValue="Apr 2024" status="Rising" />
                <MacroMetric title="RBI REPO RATE" value="6.50%" subValue="Policy Rate" status="NEUTRAL" />
                <MacroMetric title="INDUSTRIAL GROWTH (IIP)" value="3.2%" subValue="Mar 2024 (YoY)" status="Strong" />
                <MacroMetric title="FISCAL DEFICIT" value="5.6%" subValue="FY24 YTD vs BE" status="DEFENSIVE" />
                <MacroMetric title="CURRENT ACCOUNT DEFICIT" value="1.1%" subValue="% of GDP" status="Strong" />
             </Grid>
          </div>
          <div className="col-span-3 border-l border-primary pl-6 flex flex-col items-center justify-center">
             <div className="text-[10px] text-gray uppercase mb-2">MACRO SENTIMENT</div>
             <div className="text-3xl font-bold text-yellow">NEUTRAL</div>
             <div className="text-xs text-gray mt-1">52/100</div>
          </div>
        </div>
      </Card>

      {/* 2. Middle Row: Charts */}
      <Grid cols={3} gap={6}>
        <Card title="INFLATION TREND (YoY %)">
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{n: 'May', v: 7}, {n: 'Jul', v: 6.5}, {n: 'Sep', v: 6.8}, {n: 'Nov', v: 5.5}, {n: 'Jan', v: 5.1}, {n: 'Mar', v: 4.8}]}>
                <Line type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={2} dot={false} />
                <XAxis dataKey="n" hide />
                <YAxis hide domain={[0, 10]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="RBI POLICY RATE TREND (%)">
           <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{n: 'May 23', v: 4}, {n: 'Jul 23', v: 5}, {n: 'Sep 23', v: 6.5}, {n: 'Nov 23', v: 6.5}, {n: 'Jan 24', v: 6.5}, {n: 'May 24', v: 6.5}]}>
                <Line type="stepAfter" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <XAxis dataKey="n" hide />
                <YAxis hide domain={[0, 8]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="FOREIGN EXCHANGE SNAPSHOT">
          <div className="space-y-4 mt-2">
            {[
              { pair: 'USD / INR', val: '83.24', chg: '0.15', pct: '0.18%', up: true },
              { pair: 'EUR / INR', val: '90.12', chg: '0.32', pct: '0.35%', up: true },
              { pair: 'JPY / INR', val: '0.53', chg: '0.01', pct: '0.94%', up: true },
              { pair: 'GBP / INR', val: '105.42', chg: '0.28', pct: '0.27%', up: false }
            ].map(fx => (
              <div key={fx.pair} className="flex justify-between items-center text-xs">
                <span className="text-gray">{fx.pair}</span>
                <span className="text-white font-bold">{fx.val}</span>
                <span className={fx.up ? 'text-green' : 'text-red'}>{fx.up ? '▲' : '▼'} {fx.chg} ({fx.pct})</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      {/* 3. Bottom Row */}
      <Grid cols={3} gap={6}>
        <Card title="LIQUIDITY CONDITIONS">
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{n: 1, v: 10}, {n: 2, v: 15}, {n: 3, v: 12}, {n: 4, v: 25}, {n: 5, v: 20}]}>
                <Area type="monotone" dataKey="v" stroke="#22c55e" fill="rgba(34, 197, 94, 0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4">
             <div>
                <div className="text-[10px] text-gray">SYSTEM LIQUIDITY</div>
                <div className="text-sm font-bold text-green">1,62,345 Cr</div>
             </div>
             <Badge state="BULLISH">Surplus</Badge>
          </div>
        </Card>
        <Card title="GOVERNMENT BOND YIELDS (%)">
          <table className="w-full text-[10px]">
             <thead>
                <tr className="text-gray border-b border-primary">
                   <th className="text-left pb-2">TENOR</th>
                   <th className="text-right pb-2">CURRENT</th>
                   <th className="text-right pb-2">PREV</th>
                   <th className="text-right pb-2">CHG</th>
                </tr>
             </thead>
             <tbody>
                {[
                  { t: '3M', c: '6.52', p: '6.50', ch: '2' },
                  { t: '6M', c: '6.58', p: '6.55', ch: '3' },
                  { t: '1Y', c: '6.63', p: '6.61', ch: '2' },
                  { t: '5Y', c: '6.98', p: '6.92', ch: '6' },
                  { t: '10Y', c: '7.12', p: '7.06', ch: '6' }
                ].map(bond => (
                  <tr key={bond.t} className="border-b border-primary/50 last:border-0">
                    <td className="py-2 text-white">{bond.t}</td>
                    <td className="py-2 text-right text-white font-bold">{bond.c}</td>
                    <td className="py-2 text-right text-gray">{bond.p}</td>
                    <td className="py-2 text-right text-green">▲ {bond.ch}</td>
                  </tr>
                ))}
             </tbody>
          </table>
        </Card>
        <Card title="MACRO CALENDAR">
           <div className="space-y-4">
              {[
                { date: 'May 27', event: 'GDP Growth Rate (Q4 FY24)', loc: 'India' },
                { date: 'May 29', event: 'RBI Monetary Policy Meeting', loc: 'India' },
                { date: 'May 31', event: 'Core Sector Growth (Apr)', loc: 'India' },
                { date: 'Jun 03', event: 'Manufacturing PMI (May)', loc: 'India' },
                { date: 'Jun 05', event: 'US Non-Farm Payrolls (May)', loc: 'US' }
              ].map(item => (
                <div key={item.event} className="flex justify-between items-start text-[10px]">
                   <div className="text-gray w-12">{item.date}</div>
                   <div className="text-white flex-1 px-2">{item.event}</div>
                   <div className="text-gray uppercase">{item.loc}</div>
                </div>
              ))}
           </div>
           <button className="w-full text-center text-[10px] text-gray mt-4 hover:text-white">View Full Calendar →</button>
        </Card>
      </Grid>
    </div>
    </Layout>
  );
}
