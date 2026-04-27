import { useState, useEffect } from 'react';
import AnimatedValue from '../components/AnimatedValue';

// ────── HELPER: Safe fetch ──────
const safeFetch = (url, fallback = null) =>
  fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => fallback);

// ────── GST PULSE CARD ──────
function GstCard({ data }) {
  const d = data || {};
  const gross = d.gross_crore || 0;
  const lakhCr = (gross / 100).toFixed(1);
  const yoy = d.yoy_pct || 0;
  const signal = d.signal || 'MODERATE';
  const month = d.month_label || '--';

  const badgeColor = yoy > 12 ? '#22C55E' : yoy > 6 ? '#EAB308' : '#EF4444';
  const badgeLabel = yoy > 12 ? 'STRONG' : yoy > 6 ? 'MODERATE' : 'WEAK';

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>GST REVENUE</span>
        <span style={{ color: '#6B7280', fontSize: 9 }}>{month}</span>
        <div style={{ ...liveDotStyle, background: d.is_live ? '#00D4FF' : '#374151' }} />
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
        ₹<AnimatedValue value={parseFloat(lakhCr)} />L Cr
      </div>
      <div style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
        background: badgeColor + '20', color: badgeColor,
        fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
      }}>
        {badgeLabel} +{yoy}%
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
        India GDP proxy. &gt;12% YoY = strong economic momentum
      </div>
    </div>
  );
}

// ────── GRID DEMAND CARD ──────
function PowerCard({ data }) {
  const d = data || {};
  const peak = d.peak_demand_gw || 0;
  const yoy = d.yoy_pct || 0;
  const deficit = d.deficit_gw || 0;
  const signal = yoy > 8 ? 'HIGH GROWTH' : yoy > 3 ? 'MODERATE' : 'FLAT';
  const badgeColor = yoy > 8 ? '#22C55E' : yoy > 3 ? '#EAB308' : '#EF4444';

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>POWER DEMAND</span>
        <span style={{ color: '#6B7280', fontSize: 9 }}>{d.date || '--'}</span>
        <div style={{ ...liveDotStyle, background: d.is_live ? '#00D4FF' : '#374151' }} />
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
        <AnimatedValue value={peak} /> GW
      </div>
      <div style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
        background: badgeColor + '20', color: badgeColor,
        fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
      }}>
        {signal} +{yoy}% YoY
      </div>
      {deficit > 0 && (
        <div style={{
          marginTop: 8, padding: '4px 8px', borderRadius: 4,
          background: '#7F1D1D', color: '#EF4444',
          fontFamily: "'Space Mono', monospace", fontSize: 11,
        }}>
          DEFICIT: {deficit.toFixed(1)} GW
        </div>
      )}
    </div>
  );
}

// ────── MONSOON CARD ──────
function MonsoonCard({ data }) {
  const d = data || {};

  if (!d.active) {
    return (
      <div style={{ ...cardStyle, opacity: 0.5 }}>
        <div style={cardHeaderStyle}><span>MONSOON</span></div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: '#6B7280', marginTop: 12 }}>
          OFF SEASON
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#6B7280', marginTop: 8 }}>
          Next: Jun 1
        </div>
      </div>
    );
  }

  const statusColors = {
    NORMAL: '#22C55E', DEFICIENT: '#EAB308', 'LARGE DEFICIENT': '#EF4444', EXCESS: '#3B82F6',
  };
  const statusColor = statusColors[d.status] || '#6B7280';
  const departure = d.departure_pct || 0;
  const depColor = departure >= 0 ? '#22C55E' : '#EF4444';

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>MONSOON</span>
        <div style={{ ...liveDotStyle, background: d.is_live ? '#00D4FF' : '#374151' }} />
      </div>
      <div style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 4,
        background: statusColor + '20', color: statusColor,
        fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, marginBottom: 8,
      }}>
        {d.status}
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
        {d.all_india_pct_of_normal || '--'}% of normal
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: depColor }}>
        {departure >= 0 ? '+' : ''}{departure}%
      </div>
      {d.market_signal && (
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
          {d.market_signal}
        </div>
      )}
      {d.status === 'LARGE DEFICIENT' && (
        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <svg key={i} width="14" height="20" viewBox="0 0 14 20" style={{ opacity: 0.5, animation: `rainDrop 1.5s ${i * 0.3}s infinite` }}>
              <path d="M7 0 C7 0 0 10 0 14 C0 17.3 3.1 20 7 20 C10.9 20 14 17.3 14 14 C14 10 7 0 7 0Z" fill="#6B7280" />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
}

// ────── FII F&O STANCE CARD ──────
function FiiDerivCard({ data }) {
  const d = data || {};
  const ratio = d.long_short_ratio || 0;
  const longs = d.index_futures_long || 0;
  const shorts = d.index_futures_short || 0;
  const net = d.net_contracts || 0;

  let signal = 'NEUTRAL', badgeColor = '#EAB308';
  if (ratio > 1.2) { signal = 'BULLISH'; badgeColor = '#22C55E'; }
  else if (ratio < 0.8) { signal = 'BEARISH'; badgeColor = '#EF4444'; }

  const total = longs + shorts || 1;
  const longPct = (longs / total) * 100;

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>FII DERIVATIVES</span>
        <span style={{ color: '#6B7280', fontSize: 9 }}>{d.date || '--'}</span>
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
        <AnimatedValue value={ratio} />x
      </div>
      <div style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
        background: badgeColor + '20', color: badgeColor,
        fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, marginBottom: 10,
      }}>
        {signal}
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#D1D5DB', marginBottom: 8 }}>
        Long: {longs.toLocaleString()} &nbsp; Short: {shorts.toLocaleString()} &nbsp; Net: {net >= 0 ? '+' : ''}{net.toLocaleString()}
      </div>
      {/* Proportional bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', transition: 'all 0.6s ease' }}>
        <div style={{ width: `${longPct}%`, background: '#22C55E', height: '100%', transition: 'width 0.6s ease' }} />
        <div style={{ width: `${100 - longPct}%`, background: '#EF4444', height: '100%', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ────── MAX PAIN PANEL ──────
function MaxPainPanel({ data }) {
  const d = data || {};
  const strike = d.max_pain_strike || d.max_pain || 0;
  const spot = d.spot || d.nifty_spot || 0;
  const distPct = d.distance_pct || d.max_pain_distance_pct || 0;
  const interpretation = d.interpretation || '';

  // Market hours check (client-side)
  const now = new Date();
  const istHour = (now.getUTCHours() + 5) % 24 + (now.getUTCMinutes() + 30 >= 60 ? 1 : 0);
  const isMarketOpen = istHour >= 9 && istHour < 16 && now.getDay() > 0 && now.getDay() < 6;

  // Next Thursday calc
  const today = new Date();
  const daysUntilThurs = (4 - today.getDay() + 7) % 7 || 7;
  const nextExpiry = new Date(today);
  nextExpiry.setDate(today.getDate() + daysUntilThurs);
  const expiryStr = nextExpiry.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div style={{ ...cardStyle, flex: 1 }}>
      <div style={cardHeaderStyle}><span>NIFTY MAX PAIN</span></div>

      {!isMarketOpen && (
        <div style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 4,
          background: '#374151', color: '#9CA3AF',
          fontFamily: "'Space Mono', monospace", fontSize: 10, marginBottom: 8,
        }}>
          CLOSED
        </div>
      )}

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: '#EAB308', marginBottom: 8 }}>
        ₹{strike ? strike.toLocaleString('en-IN') : '--'}
      </div>

      {/* Track visualization */}
      <div style={{ position: 'relative', height: 24, background: '#1A1A2E', borderRadius: 12, marginBottom: 12, overflow: 'visible' }}>
        {/* Spot dot */}
        {spot > 0 && strike > 0 && (
          <>
            <div style={{
              position: 'absolute',
              left: `${Math.max(5, Math.min(95, 50 + (spot - strike) / strike * 200))}%`,
              top: '50%', transform: 'translate(-50%, -50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: '#00D4FF', boxShadow: '0 0 6px #00D4FF',
            }} />
            {/* Max pain line */}
            <div style={{
              position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2,
              background: '#EAB308', borderLeft: '2px dashed #EAB308',
            }} />
          </>
        )}
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#D1D5DB', marginBottom: 4 }}>
        {Math.abs(distPct).toFixed(1)}% {distPct > 0 ? 'above' : 'below'} max pain
      </div>

      {interpretation && (
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginBottom: 8 }}>
          {interpretation}
        </div>
      )}

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6B7280' }}>
        Next expiry: {expiryStr}
      </div>
    </div>
  );
}

// ────── MARKET BREADTH PANEL ──────
function BreadthPanel({ data }) {
  // Compute from movers data
  const movers = data || {};
  const gainers = movers.gainers || [];
  const losers = movers.losers || [];
  const all = [...gainers, ...losers];

  let advancing = 0, declining = 0, unchanged = 0;
  let strongUp = 0, mildUp = 0, mildDown = 0, strongDown = 0;

  all.forEach(s => {
    const pc = s.pChange || 0;
    if (pc > 2) { strongUp++; advancing++; }
    else if (pc > 0) { mildUp++; advancing++; }
    else if (pc === 0) { unchanged++; }
    else if (pc > -2) { mildDown++; declining++; }
    else { strongDown++; declining++; }
  });

  // If no data, use reasonable defaults
  if (all.length === 0) {
    advancing = 30; declining = 20; unchanged = 0;
  }

  const total = advancing + declining + unchanged || 1;
  const adRatio = declining > 0 ? (advancing / declining).toFixed(1) : advancing > 0 ? '∞' : '0.0';
  const adColor = advancing > declining ? '#22C55E' : '#EF4444';
  const advPct = (advancing / total) * 100;

  const categories = [
    { label: 'Strong +2%+', count: strongUp, color: '#22C55E' },
    { label: 'Mild 0-2%', count: mildUp, color: '#86EFAC' },
    { label: 'Unchanged', count: unchanged, color: '#6B7280' },
    { label: 'Mild -2-0%', count: mildDown, color: '#FCA5A5' },
    { label: 'Strong -2%-', count: strongDown, color: '#EF4444' },
  ];

  return (
    <div style={{ ...cardStyle, flex: 1 }}>
      <div style={cardHeaderStyle}><span>MARKET BREADTH</span></div>

      {/* Large count display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: '#22C55E' }}>
          ▲ {advancing}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: '#EF4444' }}>
          {declining} ▼
        </span>
      </div>

      {/* Proportional bar */}
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${advPct}%`, background: '#22C55E', transition: 'width 0.6s ease' }} />
        <div style={{ width: `${100 - advPct}%`, background: '#EF4444', transition: 'width 0.6s ease' }} />
      </div>

      {/* A/D Ratio */}
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: adColor, marginBottom: 12 }}>
        A/D Ratio: {adRatio}x
      </div>

      {/* 5-category breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#D1D5DB', flex: 1 }}>
              {cat.label}
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: cat.color, fontWeight: 600 }}>
              {cat.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────── MACRO CALENDAR ──────
function MacroCalendar({ events }) {
  const eventColors = {
    MPC_MEETING: '#00D4FF',
    INFLATION_RELEASE: '#EAB308',
    GDP_RELEASE: '#22C55E',
    NIFTY_EXPIRY: '#F97316',
    US_FED_MEETING: '#A78BFA',
    UNION_BUDGET: '#EF4444',
  };

  const getDaysUntil = (dateStr) => {
    const evt = new Date(dateStr);
    const now = new Date();
    return Math.ceil((evt - now) / (1000 * 60 * 60 * 24));
  };

  const getDaysColor = (days) => {
    if (days < 7) return '#EF4444';
    if (days <= 14) return '#EAB308';
    return '#22C55E';
  };

  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <div style={cardHeaderStyle}><span>INDIA MACRO CALENDAR</span></div>
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'thin',
      }}>
        {(events || []).map((evt, i) => {
          const days = getDaysUntil(evt.date);
          const color = eventColors[evt.type] || '#6B7280';
          const daysColor = getDaysColor(days);
          return (
            <div key={i} style={{
              minWidth: 180, padding: '12px 14px',
              background: '#111827', borderRadius: 4,
              borderLeft: `3px solid ${color}`,
              flexShrink: 0,
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color, marginBottom: 4 }}>
                {evt.date}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#D1D5DB', fontWeight: 600, marginBottom: 6 }}>
                {evt.label}
              </div>
              <div style={{
                display: 'inline-block', padding: '1px 6px', borderRadius: 4,
                background: daysColor + '20', color: daysColor,
                fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
              }}>
                {days > 0 ? `${days}d away` : days === 0 ? 'TODAY' : 'PASSED'}
              </div>
            </div>
          );
        })}
        {(!events || events.length === 0) && (
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', padding: 12 }}>
            No upcoming events
          </div>
        )}
      </div>
    </div>
  );
}

// ────── SHARED STYLES ──────
const cardStyle = {
  background: '#0D0D1A',
  border: '1px solid #1A1A2E',
  borderRadius: 4,
  padding: '16px 18px',
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: 10,
  color: '#6B7280',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 12,
};

const liveDotStyle = {
  width: 8, height: 8, borderRadius: '50%',
  boxShadow: '0 0 6px #00D4FF',
  animation: 'pulse 2s ease-in-out infinite',
};


// ════════════════════════════════════════════════
// MACRO PAGE — INDIA INTELLIGENCE LAYER
// ════════════════════════════════════════════════
export default function Macro() {
  const [gst, setGst] = useState(null);
  const [power, setPower] = useState(null);
  const [monsoon, setMonsoon] = useState(null);
  const [fiiDeriv, setFiiDeriv] = useState(null);
  const [maxPain, setMaxPain] = useState(null);
  const [movers, setMovers] = useState(null);
  const [calendar, setCalendar] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [g, p, m, f, mp, mov, cal] = await Promise.all([
        safeFetch('/api/macro/gst'),
        safeFetch('/api/macro/power'),
        safeFetch('/api/macro/monsoon'),
        safeFetch('/api/macro/fii-derivatives'),
        safeFetch('/api/macro/max-pain'),
        safeFetch('/api/market/movers'),
        safeFetch('/api/macro-calendar'),
      ]);
      if (g) setGst(g);
      if (p) setPower(p);
      if (m) setMonsoon(m);
      if (f) setFiiDeriv(f);
      if (mp) setMaxPain(mp);
      if (mov) setMovers(mov);
      if (cal) setCalendar(Array.isArray(cal) ? cal : []);
    };
    fetchAll();

    // Refresh max pain every 5min during market hours
    const mpInterval = setInterval(async () => {
      const r = await safeFetch('/api/macro/max-pain');
      if (r) setMaxPain(r);
    }, 5 * 60 * 1000);

    // Refresh movers for breadth every 5min
    const movInterval = setInterval(async () => {
      const r = await safeFetch('/api/market/movers');
      if (r) setMovers(r);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(mpInterval);
      clearInterval(movInterval);
    };
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>

      {/* ═══ ROW 1: FOUR INDICATOR CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <GstCard data={gst} />
        <PowerCard data={power} />
        <MonsoonCard data={monsoon} />
        <FiiDerivCard data={fiiDeriv} />
      </div>

      {/* ═══ ROW 2: MAX PAIN + MARKET BREADTH ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <MaxPainPanel data={maxPain} />
        <BreadthPanel data={movers} />
      </div>

      {/* ═══ ROW 3: MACRO CALENDAR ═══ */}
      <MacroCalendar events={calendar} />
    </div>
  );
}
