import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import AnimatedValue from '../components/AnimatedValue';

const formatIndianNumber = (value) => {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// ────── RSI BAR COMPONENT ──────
function RsiBar({ rsi }) {
  const safeRsi = rsi || 50;
  
  let label = 'NEUTRAL';
  let labelColor = '#FFFFFF';
  if (safeRsi >= 70) {
    label = 'OVERBOUGHT';
    labelColor = '#EAB308';
  } else if (safeRsi <= 30) {
    label = 'OVERSOLD';
    labelColor = '#00D4FF';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#9CA3AF' }}>
        14D RSI
      </span>
      
      <div style={{ flex: 1, height: 6, background: '#374151', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, width: '30%', height: '100%', background: '#7F1D1D' }} />
        <div style={{ position: 'absolute', right: 0, width: '30%', height: '100%', background: '#713F12' }} />
        {/* Dot */}
        <div style={{
          position: 'absolute',
          left: `${Math.max(0, Math.min(100, safeRsi))}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 8, height: 8,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 0 4px #FFF'
        }} />
      </div>

      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: labelColor }}>
        {label} {safeRsi.toFixed(1)}
      </span>
    </div>
  );
}

// ────── COMMODITY CARD ──────
const CommodityCard = ({ item }) => {
  const isUp = item.pct_change >= 0;
  const color = isUp ? '#22C55E' : '#EF4444';
  
  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1F2937',
      borderRadius: 4,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase' }}>
          {item.name}
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#6B7280' }}>
          {item.unit_label || 'INR'}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6B7280', cursor: 'pointer' }}>
          [v]
        </span>
      </div>

      {/* Price Section */}
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
        ₹<AnimatedValue value={item.price_inr} formatter={formatIndianNumber} />
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color, marginBottom: 16 }}>
        {isUp ? '▲' : '▼'} {formatIndianNumber(Math.abs(item.change_inr))} ({isUp ? '+' : ''}{item.pct_change?.toFixed(2)}%)
      </div>

      {/* Sparkline */}
      <div style={{ height: 80, width: '100%', marginBottom: 16 }}>
        {item.history && item.history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={item.history}>
              <defs>
                <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#grad-${item.id})`} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="skeleton-bar" style={{ height: '60%', width: '80%' }} />
          </div>
        )}
      </div>

      {/* Volume / OI (greyed out per spec) */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        color: '#4B5563',
        padding: '6px 0',
        borderTop: '1px solid #1F2937',
        borderBottom: '1px solid #1F2937',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Volume: N/A</span>
        <span>Open Interest: N/A</span>
      </div>

      {/* RSI Bar */}
      <RsiBar rsi={item.rsi} />

      {/* India Note */}
      <div style={{
        marginTop: 16,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
        lineHeight: 1.4,
      }}>
        <span style={{ fontSize: 12, marginTop: 1 }}>ℹ️</span>
        <span>{item.india_note || 'India market impact monitor.'}</span>
      </div>

      {/* Spacer to push duty note to bottom */}
      <div style={{ flex: 1 }} />

      {/* Duty Note */}
      <div style={{
        marginTop: 12,
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        color: '#4B5563',
      }}>
        Duty: {item.duty_note || 'Standard import duties apply.'}
      </div>
    </div>
  );
};


// ════════════════════════════════════════════════
// COMMODITIES PAGE
// ════════════════════════════════════════════════
export default function Commodities({ commodityData }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [istTime, setIstTime] = useState('');

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (3600000 * 5.5));
      const hh = String(istDate.getHours()).padStart(2, '0');
      const mm = String(istDate.getMinutes()).padStart(2, '0');
      const ss = String(istDate.getSeconds()).padStart(2, '0');
      setIstTime(`${hh}:${mm}:${ss} IST`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!commodityData) return [];
    
    // Sort array based on design doc requested order roughly, or just display as provided
    const sorted = [...commodityData];

    if (activeFilter === 'ALL') return sorted;
    
    return sorted.filter(item => {
      if (activeFilter === 'PRECIOUS' && ['gold', 'silver', 'platinum', 'palladium'].includes(item.id)) return true;
      if (activeFilter === 'ENERGY' && ['brent', 'wti', 'nat_gas'].includes(item.id)) return true;
      if (activeFilter === 'BASE METALS' && ['copper', 'aluminium', 'zinc', 'nickel', 'lead'].includes(item.id)) return true;
      return false;
    });
  }, [commodityData, activeFilter]);

  return (
    <div style={{ padding: '0 24px 80px 24px', maxWidth: 1600, margin: '0 auto' }}>
      
      {/* ══ HEADER BAR ══ */}
      <div style={{ padding: '24px 0 16px 0', borderBottom: '1px solid #1F2937', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            COMMODITY TRACKER
          </h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {['1D', '1W', '1M'].map(tf => (
              <div key={tf} style={{
                padding: '4px 8px',
                background: tf === '1D' ? '#00D4FF20' : 'transparent',
                color: tf === '1D' ? '#00D4FF' : '#4B5563',
                border: `1px solid ${tf === '1D' ? '#00D4FF' : '#1F2937'}`,
                borderRadius: 4,
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
              }}>
                {tf}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#6B7280' }}>
            Prices in Indian Rupees (Rs.) - Source: CMX/ICE via yfinance
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#9CA3AF' }}>
              Updated: {istTime}
            </span>
            <div className="live-dot" style={{ width: 6, height: 6, background: '#22C55E' }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#22C55E', fontWeight: 700 }}>
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ══ CATEGORY FILTER TABS ══ */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid #1F2937' }}>
        {['ALL', 'PRECIOUS', 'ENERGY', 'BASE METALS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeFilter === tab ? '2px solid #00D4FF' : '2px solid transparent',
              color: activeFilter === tab ? '#FFFFFF' : '#6B7280',
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              padding: '0 0 12px 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ══ COMMODITY CARD GRID ══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: 16,
      }}>
        {filteredData.map(item => (
          <CommodityCard key={item.id} item={item} />
        ))}
        {(!filteredData || filteredData.length === 0) && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#6B7280', fontFamily: "'Space Mono', monospace" }}>
            Loading commodities...
          </div>
        )}
      </div>

    </div>
  );
}
