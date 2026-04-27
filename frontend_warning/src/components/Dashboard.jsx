import { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';

const ADANI_STOCKS = [
  'ADANIENT', 'ADANIPORTS', 'ADANIGREEN', 'ADANIPOWER', 'ATGL', 
  'AWL', 'ADANIENSOL', 'ACC', 'AMBUJACEM', 'NDTV'
];

// ────── MOCK DATA ──────
const generateDashboardData = () => {
  const stocks = ADANI_STOCKS.map(symbol => {
    const dangerScore = Math.floor(Math.random() * 80 + 10); // 10 to 90
    const price = (Math.random() * 3000 + 100).toFixed(2);
    const isUp = Math.random() > 0.5;
    const pct = (Math.random() * 5).toFixed(2);
    
    // Layers
    const layers = [
      { name: 'OPTIONS', score: Math.random() * 100 },
      { name: 'MACRO', score: Math.random() * 100 },
      { name: 'LEGAL', score: Math.random() * 100 },
      { name: 'SMART', score: Math.random() * 100 },
      { name: 'SENTIMENT', score: Math.random() * 100 },
    ];
    // Find most active
    layers.sort((a, b) => b.score - a.score);
    const activeLayerName = layers[0].name;

    const getStatus = (s) => s > 80 ? 'critical' : s > 60 ? 'active' : s > 35 ? 'watch' : 'clear';

    return {
      symbol,
      name: symbol === 'ATGL' ? 'Adani Total Gas' : symbol === 'AWL' ? 'Adani Wilmar' : symbol + ' Ltd',
      price,
      pct,
      isUp,
      dangerScore,
      activeLayerName,
      layersStatus: {
        OPTIONS: getStatus(layers.find(l => l.name === 'OPTIONS').score),
        MACRO: getStatus(layers.find(l => l.name === 'MACRO').score),
        LEGAL: getStatus(layers.find(l => l.name === 'LEGAL').score),
        SMART: getStatus(layers.find(l => l.name === 'SMART').score),
        SENTIMENT: getStatus(layers.find(l => l.name === 'SENTIMENT').score),
      }
    };
  });

  // Sort descending by danger score
  stocks.sort((a, b) => b.dangerScore - a.dangerScore);

  const avgPct = stocks.reduce((acc, s) => acc + (s.isUp ? parseFloat(s.pct) : -parseFloat(s.pct)), 0) / stocks.length;

  const divergences = stocks.map(s => {
    const sPct = s.isUp ? parseFloat(s.pct) : -parseFloat(s.pct);
    if (sPct > 1 && avgPct < -0.5) return { symbol: s.symbol, type: 'DIVERGENCE', desc: `Up ${s.pct}% while group is down` };
    if (sPct < -1 && avgPct > 0.5) return { symbol: s.symbol, type: 'UNDERPERFORMING', desc: `Down ${s.pct}% while group is up` };
    return null;
  }).filter(Boolean);

  const alerts = [
    { time: '10:45 AM', stock: stocks[0].symbol, layer: 'OPTIONS ANOMALY', score: stocks[0].dangerScore, action: 'PCR Spike > 1.8x' },
    { time: '09:30 AM', stock: stocks[1].symbol, layer: 'SENTIMENT VELOCITY', score: stocks[1].dangerScore, action: 'Negative News Surge' },
    { time: 'Yesterday', stock: 'ADANIGREEN', layer: 'LEGAL RADAR', score: 75, action: 'New regulatory filing detected' }
  ];

  return { stocks, avgPct, divergences, alerts };
};

// ────── SEMI-CIRCLE GAUGE ──────
const SemiCircleGauge = ({ value, min, max, zones, title, signal }) => {
  const clampedValue = Math.min(Math.max(value, min), max);
  const percent = (clampedValue - min) / (max - min);
  const angle = 180 - (percent * 180);
  
  const pieData = zones.map(z => ({ name: z.label, value: z.max - z.min, fill: z.color }));
  const cx = '50%'; const cy = '75%';

  return (
    <div style={{ position: 'relative', width: 240, height: 160, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx={cx} cy={cy} startAngle={180} endAngle={0} innerRadius={80} outerRadius={110} paddingAngle={0} dataKey="value" stroke="none" isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '75%', left: '50%', width: 100, height: 4, background: '#111827', transformOrigin: 'left center', transform: `translate(-2px, -2px) rotate(${-angle}deg)`, borderRadius: 2, transition: 'transform 1s ease', zIndex: 10 }} />
      <div style={{ position: 'absolute', top: '75%', left: '50%', width: 20, height: 20, background: '#111827', transform: 'translate(-50%, -50%)', borderRadius: '50%', zIndex: 11 }} />
      
      <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: zones.find(z => value >= z.min && value <= z.max)?.color || '#111827', marginTop: 4 }}>
          {signal}
        </div>
      </div>
    </div>
  );
};

// ────── STATUS DOT ──────
function StatusDot({ status }) {
  const colors = { critical: '#EF4444', active: '#F59E0B', watch: '#8B5CF6', clear: '#10B981', loading: '#9CA3AF' };
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || colors.loading }} title={status} />;
}

export default function Dashboard({ onSelectStock }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(generateDashboardData());
  }, []);

  if (!data) return null;

  // Max danger score
  const groupScore = Math.max(...data.stocks.map(s => s.dangerScore));
  const groupSignal = groupScore > 80 ? 'EXIT' : groupScore > 60 ? 'REDUCE' : groupScore > 35 ? 'WATCH' : 'CLEAR';

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      
      {/* ────── HEADER ────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            ADANI WATCH SYSTEM
          </h1>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            Early warning system for Adani Group stocks
          </div>
        </div>
        <div style={{ background: '#F3F4F6', padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🛡️</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563' }}>Detection tool only. Not investment advice.</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 32 }}>
        
        {/* ────── LEFT COLUMN: GROUP RISK & ALERTS ────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* OVERALL GROUP DANGER SCORE */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '0.05em', marginBottom: 20 }}>
              ADANI GROUP RISK INDEX
            </div>
            <SemiCircleGauge 
              value={groupScore} 
              min={0} max={100} 
              signal={`GROUP SIGNAL: ${groupSignal}`}
              zones={[
                { min: 0, max: 35, color: '#10B981', label: 'CLEAR' },
                { min: 35, max: 60, color: '#F59E0B', label: 'WATCH' },
                { min: 60, max: 80, color: '#EA580C', label: 'WARNING' },
                { min: 80, max: 100, color: '#EF4444', label: 'CRITICAL' }
              ]}
            />
          </div>

          {/* CORRELATION PANEL */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '0.05em', marginBottom: 8 }}>
              GROUP CORRELATION
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.4 }}>
              Note: All 10 Adani stocks tend to move together. When one falls sharply, monitor all.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.divergences.length === 0 ? (
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, background: '#DCFCE7', padding: '8px 12px', borderRadius: 4 }}>
                  ✓ High correlation. No divergences.
                </div>
              ) : (
                data.divergences.map((div, i) => (
                  <div key={i} style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: 6, borderLeft: '3px solid #EF4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{div.symbol}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '2px 6px', borderRadius: 4 }}>
                        {div.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#4B5563' }}>{div.desc}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECENT ALERTS LOG */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '0.05em', marginBottom: 16 }}>
              RECENT ALERTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.alerts.map((alert, i) => (
                <div key={i} style={{ paddingBottom: 12, borderBottom: i === data.alerts.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#6B7280' }}>{alert.time}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>SCORE {alert.score}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{alert.stock}</div>
                  <div style={{ fontSize: 11, color: '#4B5563' }}><span style={{ fontWeight: 600 }}>{alert.layer}:</span> {alert.action}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ────── RIGHT COLUMN: STOCK GRID ────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignContent: 'start' }}>
          {data.stocks.map(stock => {
            const borderColor = stock.dangerScore > 60 ? '#EF4444' : stock.dangerScore > 35 ? '#F59E0B' : '#10B981';
            const bgHover = stock.dangerScore > 60 ? '#FEF2F2' : stock.dangerScore > 35 ? '#FFFBEB' : '#F0FDF4';

            return (
              <div 
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                onMouseEnter={(e) => e.currentTarget.style.background = bgHover}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                style={{ 
                  background: '#FFFFFF', border: '1px solid #E5E7EB', borderLeft: `4px solid ${borderColor}`,
                  borderRadius: 8, padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s',
                  display: 'flex', flexDirection: 'column', gap: 12
                }}
              >
                {/* Header: Name & Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{stock.symbol}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{stock.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      ₹{stock.price}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: stock.isUp ? '#10B981' : '#EF4444' }}>
                      {stock.isUp ? '▲' : '▼'} {stock.pct}%
                    </div>
                  </div>
                </div>

                {/* Middle: Layers & Active Alert */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '8px 12px', borderRadius: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <StatusDot status={stock.layersStatus.OPTIONS} />
                    <StatusDot status={stock.layersStatus.MACRO} />
                    <StatusDot status={stock.layersStatus.LEGAL} />
                    <StatusDot status={stock.layersStatus.SMART} />
                    <StatusDot status={stock.layersStatus.SENTIMENT} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4B5563' }}>
                    ACTIVE: <span style={{ color: borderColor }}>{stock.activeLayerName}</span>
                  </div>
                </div>

                {/* Bottom: Danger Score Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>SCORE</div>
                  <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${stock.dangerScore}%`, height: '100%', background: borderColor }} />
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#111827', width: 24, textAlign: 'right' }}>
                    {stock.dangerScore}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
