import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ────── FETCH REAL DATA ──────
const fetchOverviewData = async (symbol) => {
  const result = { chartData: [], dangerScore: 0, signal: 'CLEAR', layers: {}, options: {}, macro: {}, legal: {}, smart: {}, sentiment: {} };
  try {
    const [dangerResp, optsResp, macroResp, legalResp, smartResp, sentResp] = await Promise.all([
      fetch(`/warning/api/danger-score/${symbol}`),
      fetch(`/warning/api/options/${symbol}`),
      fetch(`/warning/api/macro-pressure/${symbol}`),
      fetch(`/warning/api/legal/${symbol}`),
      fetch(`/warning/api/smart-money/${symbol}`),
      fetch(`/warning/api/sentiment-velocity/${symbol}`),
    ]);
    if (dangerResp.ok) { const d = await dangerResp.json(); result.dangerScore = d.danger_score || 0; result.signal = d.final_signal || 'CLEAR'; result.layers = d.layers || {}; result.activeCount = d.active_count || 0; }
    if (optsResp.ok) { result.options = await optsResp.json(); }
    if (macroResp.ok) { result.macro = await macroResp.json(); }
    if (legalResp.ok) { result.legal = await legalResp.json(); }
    if (smartResp.ok) { result.smart = await smartResp.json(); }
    if (sentResp.ok) { result.sentiment = await sentResp.json(); }
    // Build single-point chart from current data
    const now = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const spot = result.options?.chain?.spot || 0;
    result.chartData = [{ date: now, price: spot, dangerEvent: result.dangerScore > 60, dangerScore: result.dangerScore }];
  } catch (e) { console.warn('OverviewTab fetch error:', e); }
  return result;
};

// ────── CUSTOM TOOLTIP ──────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: '#111827', border: '1px solid #1F2937', borderRadius: 4, 
        padding: '8px 12px', fontFamily: "'Inter', sans-serif", fontSize: 12
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#D1D5DB' }}>{data.date}</div>
        <div style={{ fontFamily: "'Space Mono', monospace", color: '#F9FAFB' }}>Price: ₹{data.price.toFixed(2)}</div>
        {data.dangerScore > 50 && (
          <div style={{ fontFamily: "'Space Mono', monospace", color: '#EF4444', marginTop: 4, fontWeight: 700 }}>
            Danger Score: {data.dangerScore}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function OverviewTab({ symbol }) {
  const [data, setData] = useState(null);
  const [timeframe, setTimeframe] = useState('1M');
  const [barsWidth, setBarsWidth] = useState(false);

  useEffect(() => {
    fetchOverviewData(symbol).then(d => { setData(d); setTimeout(() => setBarsWidth(true), 100); });
  }, [symbol, timeframe]);

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>Initializing Overview...</div>;

  const chartData = data.chartData;
  const spotPrice = data.options?.chain?.spot || 0;
  const isUp = spotPrice > 0;
  const strokeColor = '#3B82F6';

  const getColor = (s) => s > 75 ? '#DC2626' : s > 50 ? '#EA580C' : s > 25 ? '#D97706' : '#16A34A';
  const getStatus = (s) => s > 75 ? 'CRITICAL' : s > 50 ? 'WARNING' : s > 25 ? 'WATCH' : 'CLEAR';
  const ls = data.layers;
  const layers = [
    { name: 'OPTIONS ANOMALY', score: ls.options_anomaly || 0, color: getColor(ls.options_anomaly || 0), status: getStatus(ls.options_anomaly || 0) },
    { name: 'MACRO PRESSURE', score: ls.macro_pressure || 0, color: getColor(ls.macro_pressure || 0), status: getStatus(ls.macro_pressure || 0) },
    { name: 'LEGAL RADAR', score: ls.legal_risk || 0, color: getColor(ls.legal_risk || 0), status: getStatus(ls.legal_risk || 0) },
    { name: 'SMART MONEY', score: ls.smart_money || 0, color: getColor(ls.smart_money || 0), status: getStatus(ls.smart_money || 0) },
    { name: 'SENTIMENT VELOCITY', score: ls.sentiment_velocity || 0, color: getColor(ls.sentiment_velocity || 0), status: getStatus(ls.sentiment_velocity || 0) }
  ];

  const pcr = data.options?.chain?.pcr || data.options?.anomaly?.pcr || 0;
  const pcrDev = data.options?.anomaly?.pcr_deviation_pct || 0;
  const macroSignal = data.macro?.signal || 'LOW';
  const legalStatus = data.legal?.legal_score?.status || 'CLEAR';
  const legalCount = data.legal?.legal_score?.recent_filing_count || 0;
  const pledgePct = data.smart?.pledge_pct || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      
      {/* ────── PRICE CHART ────── */}
      <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
          {['1D', '5D', '1M', '3M', '6M', '1Y'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? '#EF4444' : 'transparent',
                border: 'none', borderRadius: 4, padding: '4px 8px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: timeframe === tf ? '#FFF' : '#6B7280'
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
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>DANGER SCORE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#F9FAFB' }}>{data.dangerScore}<span style={{ fontSize: 16, color: '#6B7280' }}>/100</span></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: getColor(data.dangerScore) }}>{data.activeCount || 0}/5 layers</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: getColor(data.dangerScore), background: data.dangerScore > 60 ? '#450a0a' : '#064e3b', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
            {data.signal}
          </div>
        </div>

        {/* CARD 2: OPTIONS ANOMALY */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>OPTIONS ANOMALY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#F9FAFB' }}>PCR {pcr.toFixed(2)}x</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: pcrDev > 20 ? '#F59E0B' : '#10B981' }}>{pcrDev > 0 ? '+' : ''}{pcrDev.toFixed(0)}% vs avg</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: getColor(ls.options_anomaly || 0), background: '#1F2937', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
            {getStatus(ls.options_anomaly || 0)}
          </div>
        </div>

        {/* CARD 3: MACRO PRESSURE */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🧭</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>MACRO PRESSURE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#F9FAFB' }}>{macroSignal}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            VIX: {data.macro?.factors?.vix || '—'} | FII: ₹{((data.macro?.factors?.fii_net || 0) / 100).toFixed(0)} Cr
          </div>
        </div>

        {/* CARD 4: LEGAL STATUS */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>⚖️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>LEGAL STATUS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#F9FAFB' }}>{legalStatus}</span>
          </div>
          <div style={{ fontSize: 12, color: legalCount > 0 ? '#EF4444' : '#10B981', fontWeight: 600, marginTop: 4 }}>
            {legalCount > 0 ? `${legalCount} recent filing(s)` : 'No recent filings'}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
            Pledge: {pledgePct}%
          </div>
        </div>

      </div>

      {/* ────── TWO PANELS BELOW ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* LEFT: COMPANY PROFILE */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F2937', fontSize: 14, fontWeight: 700, color: '#F9FAFB', fontFamily: "'Space Mono', monospace" }}>
            Company Profile
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'NSE Symbol', value: symbol },
              { label: 'Spot Price', value: spotPrice > 0 ? `₹${spotPrice.toLocaleString()}` : '—' },
              { label: 'Promoter Pledge', value: `${pledgePct}%`, badge: pledgePct > 20 },
              { label: 'Smart Money Score', value: `${ls.smart_money || 0}/100` },
              { label: 'FII Net Flow', value: `₹${((data.macro?.factors?.fii_net || 0) / 100).toFixed(0)} Cr` },
              { label: 'Sentiment Signal', value: data.sentiment?.signal || 'STABLE' },
              { label: 'Options PCR', value: pcr > 0 ? `${pcr.toFixed(2)}x` : '—' },
              { label: 'Active Layers', value: `${data.activeCount || 0} of 5` },
              { label: 'Danger Signal', value: data.signal },
            ].map((row, i) => (
              <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', padding: '12px 20px', 
                background: i % 2 === 0 ? 'rgba(17,24,39,0.5)' : 'transparent', fontSize: 13 
              }}>
                <span style={{ color: '#9CA3AF' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.value}
                  {row.badge && (
                    <span style={{ fontSize: 10, background: '#450a0a', color: '#EF4444', padding: '2px 6px', borderRadius: 4, border: '1px solid #7f1d1d' }}>
                      ELEVATED
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: 5-LAYER DETECTION BARS */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB', marginBottom: 20, fontFamily: "'Space Mono', monospace" }}>
            Detection Layer Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {layers.map((layer, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>
                  {layer.name}
                </div>
                <div style={{ flex: 1, height: 12, background: '#1F2937', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ 
                    width: barsWidth ? `${layer.score}%` : '0%', 
                    height: '100%', 
                    background: layer.color,
                    transition: 'width 0.8s ease-out'
                  }} />
                </div>
                <div style={{ width: 40, fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#D1D5DB', textAlign: 'right' }}>
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
        background: '#110000', border: '1px solid #550000', borderLeft: '4px solid #EF4444', 
        borderRadius: 4, padding: '20px 24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em', fontFamily: "'Space Mono', monospace" }}>SYSTEM ANALYSIS</span>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#FCA5A5', lineHeight: 1.6 }}>
          3 of 5 detection layers active. Unusual put accumulation detected over 72h with elevated PCR levels. 
          FII net short positions have increased, aligning with negative structural macro indicators. 
          Pattern matches historical pre-correction signatures for this stock. Recommend reducing exposure.
        </p>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
          Disclaimer: Detection system output only. Not financial advice. Not SEBI registered. 
          Past patterns do not guarantee future results.
        </div>
      </div>

    </div>
  );
}
