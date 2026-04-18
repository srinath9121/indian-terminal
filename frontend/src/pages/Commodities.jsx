import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import AnimatedValue from '../components/AnimatedValue';
import { Info, Globe, Activity, Zap, TrendingUp, TrendingDown } from 'lucide-react';

const formatIndianNumber = (value) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const CommodityCard = ({ item }) => {
  const isUp = item.direction === 'up';
  const color = isUp ? '#22C55E' : '#EF4444';
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsUpdating(true);
    const id = setTimeout(() => setIsUpdating(false), 800);
    return () => clearTimeout(id);
  }, [item.inr_price]);

  const sparkData = useMemo(() => 
    (item.sparkline || []).map((v, i) => ({ price: v, index: i })),
    [item.sparkline]
  );

  const rsiColor = item.rsi_label === 'OVERBOUGHT' ? '#F59E0B' : item.rsi_label === 'OVERSOLD' ? '#06B6D4' : '#22C55E';

  return (
    <div style={{
      background: '#0B0B14',
      border: `1px solid ${isUpdating ? '#00D4FF' : '#1F2937'}`,
      borderRadius: 12,
      padding: 24,
      position: 'relative',
      transition: 'all 0.4s ease',
      boxShadow: isUpdating ? '0 0 15px rgba(0,212,255,0.1)' : 'none'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: '#FFF', letterSpacing: '0.1em' }}>
          {item.name}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4B5563' }}>
          {item.unit}
        </span>
      </div>

      {/* PRICE */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: '#F3F4F6' }}>
          ₹{item.inr_price != null ? formatIndianNumber(item.inr_price) : '--'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: color, fontWeight: 600 }}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{item.inr_change != null ? formatIndianNumber(item.inr_change) : '0.00'} ({item.pct_change != null ? (item.pct_change > 0 ? '+' : '') + item.pct_change : '0.00'}%)
          </span>
        </div>
      </div>

      {/* SPARKLINE */}
      <div style={{ height: 80, margin: '16px -8px 16px -8px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={true}
            />
            <YAxis hide domain={['auto', 'auto']} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* METRICS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: '#4B5563', letterSpacing: '0.1em', marginBottom: 2 }}>USD PRICE</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>${item.usd_price}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#4B5563', letterSpacing: '0.1em', marginBottom: 2 }}>DUTY STRUCTURE</div>
          <div style={{ fontSize: 9, color: '#F59E0B', fontFamily: 'var(--font-display)' }}>{item.duty_note}</div>
        </div>
      </div>

      {/* RSI BAR */}
      <div style={{ borderTop: '1px solid #1A1A2E', paddingTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: '#4B5563', letterSpacing: '0.05em' }}>14D RSI</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: rsiColor }}>
            {item.rsi14} {item.rsi_label}
          </span>
        </div>
        <div style={{ height: 4, background: '#1A1A2E', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, height: '100%', width: '30%', background: '#EF4444', opacity: 0.2 
          }} />
          <div style={{ 
            position: 'absolute', top: 0, left: '30%', height: '100%', width: '40%', background: '#22C55E', opacity: 0.2 
          }} />
          <div style={{ 
            position: 'absolute', top: 0, left: '70%', height: '100%', width: '30%', background: '#F59E0B', opacity: 0.2 
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            left: `${item.rsi14 || 50}%`,
            width: 4,
            height: 4,
            background: '#FFF',
            borderRadius: '50%',
            transform: 'translateX(-50%)',
            boxShadow: `0 0 10px #FFF`
          }} />
        </div>
      </div>

      {/* INFO TOOLTIP ICON */}
      <div 
        title={item.india_note}
        style={{ position: 'absolute', bottom: 12, left: 12, cursor: 'help', opacity: 0.5 }}
      >
        <Info size={12} color="#9CA3AF" />
      </div>
    </div>
  );
};

export default function Commodities({ commodityData }) {
  const [filter, setFilter] = useState('ALL');
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [commodityData]);

  const filtered = useMemo(() => {
    if (!commodityData) return [];
    if (filter === 'ALL') return commodityData;
    return commodityData.filter(c => c.category.toUpperCase().replace('_', ' ') === filter);
  }, [commodityData, filter]);

  const categories = ['ALL', 'PRECIOUS', 'ENERGY', 'BASE METALS'];

  if (!commodityData) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="live-dot-amber" style={{ marginBottom: 16 }} />
        <div style={{ fontFamily: 'var(--font-mono)', color: '#555B66', fontSize: 12 }}>SYNCING WITH GLOBAL FUTURES EXCHANGES...</div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#FFF', margin: 0, fontWeight: 900, letterSpacing: '0.05em' }}>
            COMMODITY TRACKER
          </h1>
          <p style={{ fontSize: 11, color: '#8892A0', margin: '4px 0 0 0' }}>
            Prices in Indian Rupees (₹) · Source: CMX/ICE via yfinance
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 8, background: '#0D0D1A', padding: 4, borderRadius: 8, border: '1px solid #1A1A2E', marginBottom: 12 }}>
            {['1D', '1W', '1M'].map(tf => (
              <button
                key={tf}
                disabled={tf !== '1D'}
                style={{
                  background: tf === '1D' ? 'rgba(0,212,255,0.05)' : 'transparent',
                  color: tf === '1D' ? '#00FFDD' : '#374151',
                  border: 'none',
                  borderBottom: tf === '1D' ? '1px solid #00FFDD' : 'none',
                  padding: '4px 12px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  cursor: tf === '1D' ? 'pointer' : 'not-allowed'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontSize: 10, fontFamily: 'var(--font-mono)', color: '#4B5563' }}>
            Updated: {time} IST <div className="live-dot" style={{ width: 6, height: 6 }} /> LIVE
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, borderBottom: '1px solid #1A1A2E' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 4px',
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: filter === cat ? '#FFF' : '#374151',
              borderBottom: filter === cat ? '2px solid #00FFDD' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.1em'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {filtered.map(item => (
          <CommodityCard key={item.id} item={item} />
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: 48, padding: 24, borderTop: '1px solid #1A1A2E', color: '#374151', fontSize: 10, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        Source: CMX/ICE/NYM via yfinance | Prices converted to INR using live USD/INR rate
      </div>
    </div>
  );
}
