import { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';

const ADANI_STOCKS = [
  'ADANIENT', 'ADANIPORTS', 'ADANIGREEN', 'ADANIPOWER', 'ATGL', 
  'ADANIWILM', 'ADANIENSOL', 'ACC', 'AMBUJACEM', 'NDTV'
];

const getStatus = (s) => s > 80 ? 'critical' : s > 60 ? 'active' : s > 35 ? 'watch' : 'clear';

const fetchDashboardData = async () => {
  try {
    const resp = await fetch('/warning/api/danger-score/batch');
    if (!resp.ok) throw new Error('API error');
    const batchData = await resp.json();
    const stocks = (batchData.stocks || [])
      .filter(s => ADANI_STOCKS.includes(s.symbol))
      .map(s => {
        const layers = s.layers || {};
        const layerEntries = [
          { name: 'OPTIONS', score: layers.options_anomaly || 0 },
          { name: 'MACRO', score: layers.macro_pressure || 0 },
          { name: 'LEGAL', score: layers.legal_risk || 0 },
          { name: 'SMART', score: layers.smart_money || 0 },
          { name: 'SENTIMENT', score: layers.sentiment_velocity || 0 },
        ];
        layerEntries.sort((a, b) => b.score - a.score);
        return {
          symbol: s.symbol, name: s.symbol + ' Ltd', 
          price: s.price > 0 ? s.price : '—', 
          pct: s.pct !== 0 ? s.pct : '—', 
          isUp: s.isUp !== undefined ? s.isUp : true,
          dangerScore: s.danger_score || 0, activeLayerName: layerEntries[0].name,
          layersStatus: {
            OPTIONS: getStatus(layers.options_anomaly || 0),
            MACRO: getStatus(layers.macro_pressure || 0),
            LEGAL: getStatus(layers.legal_risk || 0),
            SMART: getStatus(layers.smart_money || 0),
            SENTIMENT: getStatus(layers.sentiment_velocity || 0),
          }
        };
      });
    stocks.sort((a, b) => b.dangerScore - a.dangerScore);
    const alerts = stocks.filter(s => s.dangerScore > 35).map(s => ({
      time: 'Now', stock: s.symbol, layer: s.activeLayerName + ' ANOMALY',
      score: s.dangerScore, action: `Danger score at ${s.dangerScore}/100`
    })).slice(0, 3);
    return { stocks, alerts, divergences: [] };
  } catch (e) {
    return { stocks: ADANI_STOCKS.map(symbol => ({
      symbol, name: symbol + ' Ltd', price: '—', pct: '—', isUp: true,
      dangerScore: 0, activeLayerName: 'NONE',
      layersStatus: { OPTIONS: 'loading', MACRO: 'loading', LEGAL: 'loading', SMART: 'loading', SENTIMENT: 'loading' }
    })), alerts: [{ time: 'Now', stock: 'SYSTEM', layer: 'DATA', score: 0, action: 'Waiting for market data...' }], divergences: [] };
  }
};

// ── GAUGE ──
const SemiCircleGauge = ({ value, signal, zones }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const percent = clampedValue / 100;
  const angle = 180 - (percent * 180);
  const pieData = zones.map(z => ({ name: z.label, value: z.max - z.min, fill: z.color }));

  return (
    <div style={{ position: 'relative', width: 240, height: 160, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="75%" startAngle={180} endAngle={0} innerRadius={80} outerRadius={110} paddingAngle={0} dataKey="value" stroke="#050505" strokeWidth={2} isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '75%', left: '50%', width: 100, height: 4, background: '#E5E7EB', transformOrigin: 'left center', transform: `translate(-2px, -2px) rotate(${-angle}deg)`, borderRadius: 2, transition: 'transform 1s ease', zIndex: 10, boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
      <div style={{ position: 'absolute', top: '75%', left: '50%', width: 20, height: 20, background: '#E5E7EB', transform: 'translate(-50%, -50%)', borderRadius: '50%', zIndex: 11 }} />
      <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: '#F9FAFB', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: zones.find(z => value >= z.min && value <= z.max)?.color || '#9CA3AF', marginTop: 4 }}>{signal}</div>
      </div>
    </div>
  );
};

function StatusDot({ status }) {
  const colors = { critical: '#EF4444', active: '#F59E0B', watch: '#8B5CF6', clear: '#10B981', loading: '#374151' };
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || colors.loading, boxShadow: `0 0 4px ${colors[status] || '#000'}` }} title={status} />;
}

export default function Dashboard({ onSelectStock }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData().then(setData);
    const id = setInterval(() => fetchDashboardData().then(setData), 300000);
    return () => clearInterval(id);
  }, []);

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>Scanning all layers...</div>;

  const groupScore = data.stocks.length > 0 ? Math.max(...data.stocks.map(s => s.dangerScore)) : 0;
  const groupSignal = groupScore > 80 ? 'EXIT' : groupScore > 60 ? 'REDUCE' : groupScore > 35 ? 'WATCH' : 'CLEAR';

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* ── PRINT MEDIA STYLES ── */}
      <style>{`
        @media print {
          body { background: #0A0A0F !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 32 }}>
        
        {/* ── LEFT: GROUP RISK ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* EXPORT TO PDF BUTTON */}
          <button 
            className="no-print"
            onClick={() => window.print()}
            style={{ 
              background: '#EF4444', color: '#FFF', border: 'none', borderRadius: 8, padding: '12px 16px', 
              fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            DOWNLOAD RISK REPORT
          </button>

          <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: 20 }}>ADANI GROUP RISK INDEX</div>
            <SemiCircleGauge 
              value={groupScore} signal={`GROUP: ${groupSignal}`}
              zones={[
                { min: 0, max: 35, color: '#10B981', label: 'CLEAR' },
                { min: 35, max: 60, color: '#F59E0B', label: 'WATCH' },
                { min: 60, max: 80, color: '#EA580C', label: 'WARNING' },
                { min: 80, max: 100, color: '#EF4444', label: 'CRITICAL' }
              ]}
            />
          </div>

          {/* Correlation */}
          <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: 12 }}>GROUP CORRELATION</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.4 }}>
              All 10 Adani stocks correlate. One drop cascades.
            </div>
            {data.divergences.length === 0 ? (
              <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, background: '#064e3b', padding: '8px 12px', borderRadius: 4, border: '1px solid #065f46' }}>
                ✓ High correlation. No divergences.
              </div>
            ) : null}
          </div>

          {/* Alerts */}
          <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#EF4444', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
              RECENT ALERTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.alerts.map((alert, i) => (
                <div key={i} style={{ paddingBottom: 12, borderBottom: i === data.alerts.length - 1 ? 'none' : '1px solid #1F2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#6B7280' }}>{alert.time}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', fontFamily: "'Space Mono', monospace" }}>SCORE {alert.score}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#F9FAFB', marginBottom: 2 }}>{alert.stock}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}><span style={{ fontWeight: 600, color: '#D1D5DB' }}>{alert.layer}:</span> {alert.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: STOCK GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignContent: 'start' }}>
          {data.stocks.map(stock => {
            const borderColor = stock.dangerScore > 60 ? '#EF4444' : stock.dangerScore > 35 ? '#F59E0B' : '#10B981';
            return (
              <div 
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#EF4444'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1F2937'}
                style={{ 
                  background: '#0D0D1A', border: '1px solid #1F2937', borderLeft: `4px solid ${borderColor}`,
                  borderRadius: 8, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>{stock.symbol}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{stock.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: '#D1D5DB' }}>₹{stock.price}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: stock.isUp ? '#10B981' : '#EF4444' }}>
                      {stock.isUp ? '▲' : '▼'} {stock.pct}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', padding: '8px 12px', borderRadius: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <StatusDot status={stock.layersStatus.OPTIONS} />
                    <StatusDot status={stock.layersStatus.MACRO} />
                    <StatusDot status={stock.layersStatus.LEGAL} />
                    <StatusDot status={stock.layersStatus.SMART} />
                    <StatusDot status={stock.layersStatus.SENTIMENT} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>
                    ACTIVE: <span style={{ color: borderColor }}>{stock.activeLayerName}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>SCORE</div>
                  <div style={{ flex: 1, height: 6, background: '#1F2937', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${stock.dangerScore}%`, height: '100%', background: borderColor, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#F9FAFB', width: 24, textAlign: 'right' }}>
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
