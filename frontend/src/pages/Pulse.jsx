import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import AnimatedValue from '../components/AnimatedValue';

// ────── SPARKLINE SUB-COMPONENT ──────
function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div style={{ width: 120, height: 40 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ────── METRIC CARD COMPONENT ──────
function MetricCard({ name, price, change, pChange, isUp, sparkline, isLive, flash }) {
  const color = isUp ? '#22C55E' : '#EF4444';
  const arrow = isUp ? '▲' : '▼';
  const sparkColor = isUp ? '#22C55E' : '#EF4444';

  return (
    <div
      style={{
        background: '#0D0D1A',
        border: `1px solid ${flash ? '#00D4FF' : '#1A1A2E'}`,
        borderRadius: 4,
        padding: '14px 16px',
        minWidth: 0,
        transition: 'border-color 0.8s ease',
      }}
    >
      {/* TOP ROW: label + live dot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{
          fontFamily: "'Inter', Arial, sans-serif",
          fontSize: 10,
          color: '#6B7280',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {name}
        </span>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isLive ? '#00D4FF' : '#374151',
          boxShadow: isLive ? '0 0 6px #00D4FF' : 'none',
          animation: isLive ? 'pulse 2s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* VALUE */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 28,
        fontWeight: 700,
        color: '#FFFFFF',
        marginBottom: 6,
      }}>
        <AnimatedValue value={price} />
      </div>

      {/* CHANGE + PCT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color, fontWeight: 700 }}>
          {arrow} {change != null ? (change >= 0 ? '+' : '') + Number(change).toFixed(2) : '--'}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color, opacity: 0.8 }}>
          ({pChange != null ? (pChange >= 0 ? '+' : '') + Number(pChange).toFixed(2) : '--'}%)
        </span>
      </div>

      {/* SPARKLINE */}
      <MiniSparkline data={sparkline} color={sparkColor} />
    </div>
  );
}

// ────── GTI GAUGE COMPONENT ──────
function GtiGauge({ score }) {
  const safeScore = score ?? 0;

  const getZoneLabel = (val) => {
    if (val >= 80) return 'CRITICAL';
    if (val >= 60) return 'ELEVATED';
    if (val >= 35) return 'MODERATE';
    return 'LOW';
  };

  const getZoneColor = (val) => {
    if (val >= 80) return '#EF4444';
    if (val >= 60) return '#F97316';
    if (val >= 35) return '#EAB308';
    return '#16A34A';
  };

  const zoneLabel = getZoneLabel(safeScore);
  const zoneColor = getZoneColor(safeScore);

  // SVG semicircular gauge
  const cx = 100, cy = 100, r = 80;
  const startAngle = Math.PI;
  const sweepAngle = Math.PI;

  // Zone arcs
  const zones = [
    { from: 0,  to: 35,  color: '#16A34A' },
    { from: 35, to: 60,  color: '#EAB308' },
    { from: 60, to: 80,  color: '#F97316' },
    { from: 80, to: 100, color: '#EF4444' },
  ];

  const arcPath = (start, end) => {
    const a1 = startAngle + (start / 100) * sweepAngle;
    const a2 = startAngle + (end / 100) * sweepAngle;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const largeArc = (a2 - a1) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle
  const needleAngle = startAngle + (safeScore / 100) * sweepAngle;
  const needleLen = 65;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  return (
    <div style={{
      background: '#0D0D1A',
      border: '1px solid #1A1A2E',
      borderRadius: 4,
      padding: 20,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'Inter', Arial, sans-serif",
        fontSize: 10,
        color: '#6B7280',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        INDIA GTI (Geopolitical Tension Index)
      </div>

      <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 260 }}>
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.from, z.to)} fill="none" stroke={z.color} strokeWidth="10" strokeLinecap="butt" opacity={0.6} />
        ))}
        {/* Needle */}
        <line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={zoneColor} strokeWidth="3" strokeLinecap="round"
          style={{ transition: 'all 0.8s ease-out' }}
        />
        <circle cx={cx} cy={cy} r="5" fill={zoneColor} />
        <text x="20" y="115" fill="#6B7280" fontFamily="'Space Mono', monospace" fontSize="9" textAnchor="middle">0</text>
        <text x="180" y="115" fill="#6B7280" fontFamily="'Space Mono', monospace" fontSize="9" textAnchor="middle">100</text>
      </svg>

      {/* Score */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 32,
        fontWeight: 700,
        color: zoneColor,
        marginTop: -8,
      }}>
        <AnimatedValue value={safeScore} color={zoneColor} />
      </div>

      {/* Zone label */}
      <div style={{
        fontFamily: "'Inter', Arial, sans-serif",
        fontSize: 11,
        color: zoneColor,
        fontWeight: 600,
        letterSpacing: '0.1em',
        marginTop: 4,
      }}>
        {zoneLabel}
      </div>
    </div>
  );
}

// ────── FII/DII FLOW PANEL ──────
function FiiDiiPanel({ data }) {
  if (!data) {
    return (
      <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 4, padding: 20 }}>
        <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: 10, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>FII/DII FLOWS</div>
        <div style={{ color: '#6B7280', fontFamily: "'Space Mono', monospace", fontSize: 11 }}>Loading...</div>
      </div>
    );
  }

  const fiiNet = data?.fii?.net;
  const diiNet = data?.dii?.net;

  // Signal logic per doc
  let signal = 'NEUTRAL';
  if (fiiNet > 0) signal = 'BULLISH';
  else if (fiiNet < 0 && diiNet < 0) signal = 'BEARISH';

  const signalColor = signal === 'BULLISH' ? '#22C55E' : signal === 'BEARISH' ? '#EF4444' : '#EAB308';
  const signalBg = signal === 'BULLISH' ? '#14532D' : signal === 'BEARISH' ? '#7F1D1D' : '#713F12';

  const fiiColor = fiiNet != null ? (fiiNet >= 0 ? '#22C55E' : '#EF4444') : '#6B7280';
  const diiColor = diiNet != null ? (diiNet >= 0 ? '#22C55E' : '#EF4444') : '#6B7280';

  // Buy/Sell bar
  const fiiBuy = data?.fii?.buy || 0;
  const fiiSell = data?.fii?.sell || 0;
  const fiiTotal = fiiBuy + fiiSell || 1;

  return (
    <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 4, padding: 20 }}>
      <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: 10, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>FII/DII FLOWS</div>

      {/* FII Net */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: 11, color: '#6B7280', marginBottom: 4 }}>FII Net</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: fiiColor }}>
          {fiiNet != null ? <>{fiiNet >= 0 ? '+' : ''}<AnimatedValue value={fiiNet} color={fiiColor} /> <span style={{ fontSize: 13 }}>₹Cr</span></> : 'N/A'}
        </div>
      </div>

      {/* DII Net */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: 11, color: '#6B7280', marginBottom: 4 }}>DII Net</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: diiColor }}>
          {diiNet != null ? <>{diiNet >= 0 ? '+' : ''}<AnimatedValue value={diiNet} color={diiColor} /> <span style={{ fontSize: 13 }}>₹Cr</span></> : 'N/A'}
        </div>
      </div>

      {/* Signal badge */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        fontWeight: 700,
        color: '#FFFFFF',
        padding: '4px 12px',
        background: signalBg,
        borderRadius: 4,
        display: 'inline-block',
        marginBottom: 14,
      }}>
        {signal}
      </div>

      {/* FII Buy vs Sell bar */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${(fiiBuy / fiiTotal) * 100}%`, background: '#22C55E', height: '100%' }} />
          <div style={{ width: `${(fiiSell / fiiTotal) * 100}%`, background: '#EF4444', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#22C55E' }}>BUY {fiiBuy ? `₹${fiiBuy}Cr` : ''}</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#EF4444' }}>SELL {fiiSell ? `₹${fiiSell}Cr` : ''}</span>
        </div>
      </div>

      {data?.date && data.date !== 'Unavailable' && (
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#6B7280', marginTop: 10 }}>
          Data: {data.date}
        </div>
      )}
      {data?.note === 'Volume proxy' && (
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#F97316', marginTop: 4 }}>
          Institutional proxy (volume-derived)
        </div>
      )}
    </div>
  );
}

// ────── SECTOR HEATMAP COMPONENT ──────
function SectorHeatmap({ sectors }) {
  const SECTOR_NAMES = ['IT', 'BANK', 'AUTO', 'FMCG', 'PHARMA', 'ENERGY', 'METAL', 'REALTY', 'INFRA', 'MEDIA'];

  const interpolateColor = (pChange) => {
    // From #7F1D1D (red, -3%) to #14532D (green, +3%)
    const clamped = Math.max(-3, Math.min(3, pChange || 0));
    const t = (clamped + 3) / 6; // 0 to 1
    const r = Math.round(127 * (1 - t) + 20 * t);
    const g = Math.round(29 * (1 - t) + 83 * t);
    const b = Math.round(29 * (1 - t) + 45 * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Map sectors to 2x5 grid
  const displaySectors = SECTOR_NAMES.map((name) => {
    const found = (sectors || []).find(s =>
      s.name?.toUpperCase().includes(name) || s.sector?.toUpperCase().includes(name)
    );
    return {
      name,
      pChange: found?.pChange ?? 0,
    };
  });

  return (
    <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 4, padding: 20 }}>
      <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: 10, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
        SECTOR PERFORMANCE
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {displaySectors.map((s, i) => (
          <div
            key={i}
            style={{
              background: interpolateColor(s.pChange),
              borderRadius: 4,
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#D1D5DB', fontWeight: 600 }}>
              {s.name}
            </span>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: '#FFFFFF',
            }}>
              {s.pChange >= 0 ? '+' : ''}{s.pChange.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────── NEWS TICKER ──────
function NewsTicker({ news }) {
  if (!news || news.length === 0) return null;

  const sourceColors = {
    ET: '#F97316',
    RBI: '#3B82F6',
    SEBI: '#A855F7',
    PIB: '#22C55E',
    IMD: '#14B8A6',
  };

  const biasColor = (bias) => {
    if (bias === 'bullish') return '#22C55E';
    if (bias === 'bearish') return '#EF4444';
    return '#D1D5DB';
  };

  const items = [...news, ...news]; // Duplicate for seamless loop

  return (
    <div style={{
      width: '100%',
      background: '#0A0A0FCC',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid #1A1A2E',
      overflow: 'hidden',
      padding: '10px 0',
      position: 'fixed',
      bottom: 0,
      left: 0,
      zIndex: 1000,
    }}>
      <div className="marquee-content" style={{ animationDuration: '60s' }}>
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 40, textDecoration: 'none' }}
          >
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: '#FFFFFF',
              padding: '1px 6px',
              background: sourceColors[item.source?.toUpperCase()] || '#374151',
              borderRadius: 2,
              fontWeight: 600,
            }}>
              {item.source}
            </span>
            <span style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 12,
              color: biasColor(item.bias),
            }}>
              {item.headline}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════
// PULSE PAGE — LIVE MARKET OVERVIEW
// ════════════════════════════════════════════════
export default function Pulse({ liveData }) {
  const [signals, setSignals] = useState(null);
  const [fiiDii, setFiiDii] = useState(null);
  const [gtiScore, setGtiScore] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [news, setNews] = useState([]);
  const [flashCards, setFlashCards] = useState(false);
  const [sparkHistory, setSparkHistory] = useState({});
  const prevDataRef = useRef(null);

  // ────── INITIAL DATA FETCH ──────
  useEffect(() => {
    const safeFetch = (url, fallback = null) =>
      fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => fallback);

    const fetchAll = async () => {
      const [sig, fii, gti, sec, newsData] = await Promise.all([
        safeFetch('/api/signals'),
        safeFetch('/api/fii-dii'),
        safeFetch('/api/gdelt/india-events'),
        safeFetch('/api/sector-performance'),
        safeFetch('/api/geopolitical-news'),
      ]);

      if (sig) setSignals(sig);
      if (fii) setFiiDii(fii);
      if (gti) setGtiScore(gti.gti ?? gti.score ?? 0);
      if (sec) {
        if (sec.data) setSectors(sec.data);
        else if (Array.isArray(sec)) setSectors(sec);
      }
      if (newsData) {
        if (newsData.items) setNews(newsData.items);
        else if (Array.isArray(newsData)) setNews(newsData);
      }
    };

    fetchAll();

    // Refresh intervals per doc spec
    const fiiInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/fii-dii');
        if (r.ok) setFiiDii(await r.json());
      } catch {}
    }, 5 * 60 * 1000); // 5min

    const gtiInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/gdelt/india-events');
        if (r.ok) {
          const d = await r.json();
          setGtiScore(d.gti ?? d.score ?? 0);
        }
      } catch {}
    }, 15 * 60 * 1000); // 15min

    const sectorInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/sector-performance');
        if (r.ok) {
          const d = await r.json();
          if (d?.data) setSectors(d.data);
        }
      } catch {}
    }, 5 * 60 * 1000); // 5min

    const newsInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/geopolitical-news');
        if (r.ok) {
          const d = await r.json();
          if (d?.items) setNews(d.items);
          else if (Array.isArray(d)) setNews(d);
        }
      } catch {}
    }, 10 * 60 * 1000); // 10min

    return () => {
      clearInterval(fiiInterval);
      clearInterval(gtiInterval);
      clearInterval(sectorInterval);
      clearInterval(newsInterval);
    };
  }, []);

  // ────── UPDATE FROM WEBSOCKET ──────
  useEffect(() => {
    if (liveData) {
      setSignals(liveData);
      if (liveData.NEWS) setNews(liveData.NEWS);

      // Build spark history from WS ticks
      if (liveData.MARKET) {
        setSparkHistory(prev => {
          const next = { ...prev };
          for (const [key, val] of Object.entries(liveData.MARKET)) {
            if (val?.price != null) {
              const arr = next[key] || [];
              arr.push(val.price);
              if (arr.length > 5) arr.shift();
              next[key] = arr;
            }
          }
          return next;
        });
      }

      // Flash cards on update
      if (prevDataRef.current) {
        setFlashCards(true);
        setTimeout(() => setFlashCards(false), 800);
      }
      prevDataRef.current = liveData;
    }
  }, [liveData]);

  const market = signals?.MARKET || {};

  // ── The 6 cards as specified in the doc ──
  const cards = [
    { name: 'NIFTY 50',    key: 'NIFTY' },
    { name: 'SENSEX',      key: 'SENSEX' },
    { name: 'BANKNIFTY',   key: 'BANKNIFTY' },
    { name: 'INDIA VIX',   key: 'INDIAVIX' },
    { name: 'BRENT CRUDE', key: 'BRENT' },
    { name: 'USD/INR',     key: 'USD/INR' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto', paddingBottom: 60 }}>

      {/* ═══ ROW 1: SIX LIVE METRIC CARDS ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}>
        {cards.map((c) => {
          const d = market[c.key];
          const isUp = d?.is_up ?? (d?.change >= 0);
          return (
            <MetricCard
              key={c.key}
              name={c.name}
              price={d?.price}
              change={d?.change}
              pChange={d?.pChange}
              isUp={isUp}
              isLive={!!d}
              sparkline={sparkHistory[c.key]}
              flash={flashCards}
            />
          );
        })}
      </div>

      {/* ═══ ROW 2: THREE PANELS ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* LEFT: FII/DII FLOW */}
        <FiiDiiPanel data={fiiDii} />

        {/* CENTER: INDIA GTI GAUGE */}
        <GtiGauge score={gtiScore} />

        {/* RIGHT: SECTOR HEATMAP */}
        <SectorHeatmap sectors={sectors} />
      </div>

      {/* ═══ ROW 3: NEWS TICKER ═══ */}
      <NewsTicker news={news} />
    </div>
  );
}
