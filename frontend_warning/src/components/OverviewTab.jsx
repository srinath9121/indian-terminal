import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ────── MOCK DATA GENERATION ──────
const generateChartData = () => {
  let data = [];
  let currentPrice = 3000;
  let date = new Date();
  date.setDate(date.getDate() - 30); // 30 days data

  for (let i = 0; i < 30; i++) {
    currentPrice = currentPrice + (Math.random() * 100 - 45);
    let dangerEvent = i === 15 || i === 28 ? true : false;
    let dangerScore = dangerEvent ? Math.floor(Math.random() * 20 + 80) : Math.floor(Math.random() * 30 + 10);
    
    data.push({
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      price: currentPrice,
      dangerEvent: dangerEvent,
      dangerScore: dangerScore
    });
    date.setDate(date.getDate() + 1);
  }
  return data;
};

// ────── CUSTOM TOOLTIP ──────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 4, 
        padding: '8px 12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontFamily: "'Inter', sans-serif", fontSize: 12
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#111827' }}>{data.date}</div>
        <div style={{ fontFamily: "'Space Mono', monospace", color: '#111827' }}>Price: ₹{data.price.toFixed(2)}</div>
        {data.dangerScore > 50 && (
          <div style={{ fontFamily: "'Space Mono', monospace", color: '#DC2626', marginTop: 4, fontWeight: 700 }}>
            Danger Score: {data.dangerScore}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function OverviewTab({ symbol }) {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('1M');
  const [barsWidth, setBarsWidth] = useState(false);

  useEffect(() => {
    setChartData(generateChartData());
    // Trigger bar animation
    setTimeout(() => setBarsWidth(true), 100);
  }, [symbol, timeframe]);

  const openPrice = chartData.length > 0 ? chartData[0].price : 3000;
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 3000;
  const isUp = currentPrice >= openPrice;
  const strokeColor = isUp ? '#10B981' : '#EF4444';

  const layers = [
    { name: 'OPTIONS ANOMALY', score: 85, color: '#DC2626', status: 'CRITICAL' },
    { name: 'MACRO PRESSURE', score: 45, color: '#D97706', status: 'ACTIVE' },
    { name: 'LEGAL RADAR', score: 25, color: '#16A34A', status: 'CLEAR' },
    { name: 'SMART MONEY', score: 72, color: '#EA580C', status: 'WARNING' },
    { name: 'SENTIMENT VELOCITY', score: 65, color: '#EA580C', status: 'WARNING' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      
      {/* ────── PRICE CHART ────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
          {['1D', '5D', '1M', '3M', '6M', '1Y'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? '#F3F4F6' : 'transparent',
                border: 'none', borderRadius: 4, padding: '4px 8px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: timeframe === tf ? '#111827' : '#6B7280'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip content={<CustomTooltip />} />
              {chartData.filter(d => d.dangerEvent).map((d, i) => (
                <ReferenceLine 
                  key={i} 
                  x={d.date} 
                  stroke="#DC2626" 
                  strokeDasharray="3 3" 
                  label={{ position: 'top', value: `SCORE ${d.dangerScore}`, fill: '#DC2626', fontSize: 10, fontFamily: "'Space Mono', monospace" }}
                />
              ))}
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ────── FOUR SUMMARY CARDS ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        
        {/* CARD 1: DANGER SCORE */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', letterSpacing: '0.05em' }}>DANGER SCORE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#111827' }}>85<span style={{ fontSize: 16, color: '#6B7280' }}>/100</span></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#EF4444' }}>▲ +12 today</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
            CRITICAL EXIT
          </div>
        </div>

        {/* CARD 2: OPTIONS ANOMALY */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', letterSpacing: '0.05em' }}>OPTIONS ANOMALY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#111827' }}>PCR 1.8x</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>+40% vs 30d</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', background: '#FEF3C7', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
            ELEVATED
          </div>
        </div>

        {/* CARD 3: MACRO PRESSURE */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🧭</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', letterSpacing: '0.05em' }}>MACRO PRESSURE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#111827' }}>HIGH</span>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            Contributing: FII net + VIX level
          </div>
        </div>

        {/* CARD 4: LEGAL STATUS */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>⚖️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', letterSpacing: '0.05em' }}>LEGAL STATUS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#111827' }}>ALERT</span>
          </div>
          <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, marginTop: 4 }}>
            New filing detected
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
            Last checked: 5min ago
          </div>
        </div>

      </div>

      {/* ────── TWO PANELS BELOW ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* LEFT: COMPANY PROFILE */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', fontSize: 14, fontWeight: 700, color: '#111827' }}>
            Company Profile
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'Sector', value: 'Infrastructure / Energy' },
              { label: 'Market Cap', value: '₹3,50,000 Cr (Large Cap)' },
              { label: 'Promoter Holding', value: '65.4%' },
              { label: 'Promoter Pledge', value: '45.0%', badge: true },
              { label: 'FII Holding', value: '18.5%' },
              { label: 'DII Holding', value: '5.2%' },
              { label: 'Listed Since', value: '1994' },
              { label: 'NSE Symbol', value: symbol },
              { label: 'Adani Group', value: 'Yes' },
            ].map((row, i) => (
              <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', padding: '12px 20px', 
                background: i % 2 === 0 ? '#F9FAFB' : '#FFFFFF', fontSize: 13 
              }}>
                <span style={{ color: '#6B7280' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.value}
                  {row.badge && (
                    <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: 4 }}>
                      ELEVATED
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: 5-LAYER DETECTION BARS */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
            Detection Layer Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {layers.map((layer, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: '#4B5563', letterSpacing: '0.05em' }}>
                  {layer.name}
                </div>
                <div style={{ flex: 1, height: 12, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ 
                    width: barsWidth ? `${layer.score}%` : '0%', 
                    height: '100%', 
                    background: layer.color,
                    transition: 'width 0.8s ease-out'
                  }} />
                </div>
                <div style={{ width: 40, fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#111827', textAlign: 'right' }}>
                  {layer.score}%
                </div>
                <div style={{ width: 80, fontSize: 11, fontWeight: 700, color: layer.color, textAlign: 'right' }}>
                  {layer.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────── AI ANALYSIS BOX ────── */}
      <div style={{ 
        background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: '4px solid #0077CC', 
        borderRadius: 4, padding: '20px 24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0077CC', letterSpacing: '0.05em' }}>SYSTEM ANALYSIS</span>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#1E3A8A', lineHeight: 1.6 }}>
          3 of 5 detection layers active. Unusual put accumulation detected over 72h with elevated PCR levels. 
          FII net short positions have increased, aligning with negative structural macro indicators. 
          Pattern matches historical pre-correction signatures for this stock. Recommend reducing exposure.
        </p>
        <div style={{ fontSize: 11, color: '#60A5FA', fontStyle: 'italic' }}>
          Disclaimer: Detection system output only. Not financial advice. Not SEBI registered. 
          Past patterns do not guarantee future results.
        </div>
      </div>

    </div>
  );
}
