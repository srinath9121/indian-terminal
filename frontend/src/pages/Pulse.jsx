import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import AnimatedValue from '../components/AnimatedValue';
import RelativeTime from '../components/RelativeTime';

// ────── METRIC CARD COMPONENT ──────
function MetricCard({ name, price, change, pChange, direction }) {
  const isUp = direction === 'up';
  const arrow = isUp ? '▲' : '▼';
  const color = isUp ? '#00FF88' : '#FF4444';

  return (
    <div
      style={{
        background: '#0D0D1A',
        border: '1px solid #1A1A2E',
        borderRadius: 8,
        padding: '16px 20px',
        minWidth: 0,
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1A1A4E'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1A1A2E'}
    >
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 10,
        color: '#8892A0',
        marginBottom: 8,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {name}
      </div>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 22,
        fontWeight: 700,
        color: '#FFFFFF',
        marginBottom: 6,
      }}>
        {['NIFTY', 'SENSEX', 'GOLD', 'SILVER', 'BRENT', 'COPPER'].includes(name) ? '₹' : ''}
        <AnimatedValue value={price} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color, fontWeight: 700 }}>
          <AnimatedValue value={change} prefix={`${arrow} ${change >= 0 ? '+' : ''}`} color={color} />
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color,
          opacity: 0.8,
        }}>
          (<AnimatedValue value={pChange} prefix={pChange >= 0 ? '+' : ''} suffix="%" color={color} />)
        </span>
      </div>
    </div>
  );
}

// ────── IRS WIDGET COMPONENT ──────
function IrsWidget({ irsData, history }) {
  if (!irsData) {
    return (
      <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 8, padding: 20, textAlign: 'center' }}>
        <div style={{ color: '#555B66', fontFamily: "var(--font-mono)", fontSize: 11 }}>Loading IRS Data...</div>
      </div>
    );
  }

  const { irs, mode, zone, factors, top_risk_drivers, updated_at } = irsData;

  const getZoneColor = (val) => {
    if (val >= 80) return '#EF4444'; // EXTREME
    if (val >= 60) return '#F97316'; // ELEVATED
    if (val >= 35) return '#EAB308'; // MODERATE
    return '#22C55E'; // LOW
  };

  const modeColor = mode === 'RISK ON' ? '#22C55E' : mode === 'RISK OFF' ? '#EF4444' : '#F97316';
  const scoreColor = getZoneColor(irs);

  // Gauge angle logic
  const angle = ((irs / 100) * 180) - 90;

  return (
    <div style={{
      background: '#0D0D1A',
      border: '1px solid #1A1A2E',
      borderRadius: 8,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      {/* TOP ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 10, color: '#8892A0', letterSpacing: '0.1em' }}>
            INDIA RISK SCORE
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: `${modeColor}15`,
            color: modeColor,
            border: `1px solid ${modeColor}30`,
            padding: '2px 8px',
            borderRadius: 4,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 4
          }}>
            {mode}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: '#555B66' }}>
            {updated_at ? <RelativeTime dateString={updated_at} /> : 'Awaiting data...'}
          </div>
        </div>
      </div>

      {/* SCORE + GAUGE */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 42, fontWeight: 700, color: scoreColor }}>
            <AnimatedValue value={irs} color={scoreColor} />
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: '#555B66' }}>
            /100
          </span>
        </div>
        <div style={{ width: '100%', maxWidth: 220, margin: '0 auto', marginTop: -10 }}>
          <svg viewBox="0 0 200 120" style={{ width: '100%' }}>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            {/* Needle */}
            <g transform={`rotate(${angle}, 100, 100)`} style={{ transition: 'transform 0.6s ease-out' }}>
              <line x1="100" y1="100" x2="100" y2="30" stroke={scoreColor} strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5" fill={scoreColor} />
            </g>
            <text x="20" y="115" fill="#555B66" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle">0</text>
            <text x="100" y="20" fill="#555B66" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle">50</text>
            <text x="180" y="115" fill="#555B66" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle">100</text>
          </svg>
        </div>
      </div>

      {/* 24H HISTORY SPARKLINE */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#8892A0' }}>24H HISTORY</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: '#555B66' }}>{history.length} readings</span>
        </div>
        <div style={{ height: 60 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <Area type="monotone" dataKey="irs" stroke="#F97316" fill="#F97316" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CONTRIBUTING FACTORS */}
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#8892A0', marginBottom: 8 }}>CONTRIBUTING FACTORS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {factors && Object.entries(factors).map(([k, v]) => {
            const barColor = getZoneColor(v.score);
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#CCC', width: 120 }}>
                  {v.label}
                </span>
                <div style={{ flex: 1, height: 4, background: '#1A1A2E', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${v.score}%`,
                    height: '100%',
                    background: barColor,
                    transition: 'width 0.6s ease'
                  }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: barColor, width: 30, textAlign: 'right' }}>
                  <AnimatedValue value={v.score} color={barColor} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP RISK DRIVERS */}
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#8892A0', marginBottom: 8 }}>TOP RISK DRIVERS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(top_risk_drivers || []).slice(0, 3).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ color: '#EF4444', fontSize: 12 }}>⚠</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: '#CCC', lineHeight: 1.3 }}>
                {item.headline.length > 60 ? item.headline.substring(0, 60) + '...' : item.headline}
              </span>
            </div>
          ))}
          {(!top_risk_drivers || top_risk_drivers.length === 0) && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: '#555B66' }}>No active danger signals.</span>
          )}
        </div>
      </div>

      {/* GRADIENT BAR */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: "var(--font-mono)", fontSize: 9, color: '#8892A0' }}>
          <span>LOW RISK</span>
          <span>MODERATE</span>
          <span>ELEVATED</span>
          <span>EXTREME</span>
        </div>
        <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #22C55E 0%, #EAB308 50%, #EF4444 80%, #7F1D1D 100%)' }}>
          <div style={{
            position: 'absolute',
            left: `${irs}%`,
            top: -4,
            width: 4,
            height: 16,
            background: '#FFF',
            borderRadius: 2,
            boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            transform: 'translateX(-50%)',
            transition: 'left 0.6s ease'
          }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 10, color: '#8892A0' }}>
          IRS {irs}/100 — <span style={{ color: modeColor }}>{mode} ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

// ────── SECTOR HEATMAP COMPONENT ──────
function SectorHeatmap({ sectors }) {
  if (!sectors || sectors.length === 0) {
    return (
      <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 8, padding: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: '#8892A0', letterSpacing: '0.15em', marginBottom: 12 }}>
          SECTOR HEATMAP
        </div>
        <div style={{ color: '#555B66', fontFamily: "var(--font-mono)", fontSize: 11 }}>Loading...</div>
      </div>
    );
  }

  const getColor = (pChange) => {
    if (pChange >= 2) return '#00FF88';
    if (pChange >= 0.5) return '#00CC66';
    if (pChange >= 0) return '#335544';
    if (pChange >= -0.5) return '#553333';
    if (pChange >= -2) return '#CC3333';
    return '#FF4444';
  };

  return (
    <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 8, padding: 20 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: '#8892A0', letterSpacing: '0.15em', marginBottom: 12 }}>
        SECTOR HEATMAP
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {sectors.slice(0, 10).map((s, i) => (
          <div
            key={i}
            style={{
              background: `${getColor(s.pChange)}20`,
              border: `1px solid ${getColor(s.pChange)}40`,
              borderRadius: 4,
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: '#CCC' }}>
              {s.name}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: getColor(s.pChange),
            }}>
              {s.pChange != null ? (s.pChange >= 0 ? '+' : '') + s.pChange.toFixed(2) : '0.00'}%
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

  const biasColor = (bias) => {
    if (bias === 'bullish') return '#00FF88';
    if (bias === 'bearish') return '#FF4444';
    return '#8892A0';
  };

  const items = [...news, ...news]; // Duplicate for seamless loop
  const duration = items.length * 8; // ~8s per headline

  return (
    <div style={{
      width: '100%',
      background: '#0A0A12CC',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid #1A1A2E',
      overflow: 'hidden',
      padding: '10px 0',
      position: 'fixed',
      bottom: 0,
      left: 0,
      zIndex: 1000,
    }}>
      <div className="marquee-content" style={{ animationDuration: `${duration}s` }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 40 }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: '#555B66',
              padding: '1px 4px',
              border: '1px solid #1A1A2E',
              borderRadius: 2,
            }}>
              {item.source}
            </span>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: biasColor(item.bias),
            }}>
              {item.headline}
            </span>
            <span style={{ color: '#1A1A2E' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════
// PULSE PAGE
// ════════════════════════════════════════════════
export default function Pulse({ liveData }) {
  const [signals, setSignals] = useState(null);
  const [fiiDii, setFiiDii] = useState(null);
  const [gtiData, setGtiData] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [news, setNews] = useState([]);
  const [irsData, setIrsData] = useState(null);
  const [irsHistory, setIrsHistory] = useState([]);
  const [flashCards, setFlashCards] = useState(false);
  const prevDataRef = useRef(null);

  // ────── INITIAL DATA FETCH ──────
  useEffect(() => {
    const fetchAll = async () => {
      const safeFetch = (url, fallback = null) =>
        fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => fallback);

      const [sig, fii, sec, newsData, irsResp] = await Promise.all([
        safeFetch('/api/signals'),
        safeFetch('/api/fii-dii'),
        safeFetch('/api/sector-performance'),
        safeFetch('/api/geopolitical-news'),
        safeFetch('/api/india-risk-score')
      ]);

      if (sig) setSignals(sig);
      if (fii) setFiiDii(fii);
      
      // Handle potential structures for sectors ({data:[]} or [])
      if (sec) {
        if (sec.data) setSectors(sec.data);
        else if (Array.isArray(sec)) setSectors(sec);
      }
      
      // Handle potential structures for news ({items:[]} or [])
      if (newsData) {
        if (newsData.items) setNews(newsData.items);
        else if (Array.isArray(newsData)) setNews(newsData);
      }
      
      if (irsResp) {
        setIrsData(irsResp);
        setIrsHistory(prev => {
           const newHist = [...prev, { time: new Date().toLocaleTimeString(), irs: irsResp.irs }];
           return newHist.slice(-30);
        });
      }
    };

    fetchAll();

    // Independent refresh intervals
    const fiiInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/fii-dii');
        if (r.ok) setFiiDii(await r.json());
      } catch {}
    }, 5 * 60 * 1000);

    const irsInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/india-risk-score');
        if (r.ok) {
           const d = await r.json();
           setIrsData(d);
           setIrsHistory(prev => {
              const newHist = [...prev, { time: new Date().toLocaleTimeString(), irs: d.irs }];
              return newHist.slice(-30);
           });
        }
      } catch {}
    }, 10 * 60 * 1000);

    const sectorInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/sector-performance');
        if (r.ok) {
          const d = await r.json();
          if (d?.data) setSectors(d.data);
        }
      } catch {}
    }, 10 * 60 * 1000);

    const newsInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/geopolitical-news');
        if (r.ok) {
          const d = await r.json();
          if (d?.items) setNews(d.items);
        }
      } catch {}
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(fiiInterval);
      clearInterval(irsInterval);
      clearInterval(sectorInterval);
      clearInterval(newsInterval);
    };
  }, []);

  // ────── UPDATE FROM WEBSOCKET ──────
  useEffect(() => {
    if (liveData) {
      setSignals(liveData);
      if (liveData.NEWS) setNews(liveData.NEWS);
      if (liveData.irs != null) {
          setIrsData(prev => prev ? { ...prev, irs: liveData.irs } : null);
          setIrsHistory(prev => {
              if (prev.length > 0 && prev[prev.length - 1].irs === liveData.irs) return prev;
              const newHist = [...prev, { time: new Date().toLocaleTimeString(), irs: liveData.irs }];
              return newHist.slice(-30);
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
  const cards = [
    { name: 'NIFTY 50', key: 'NIFTY' },
    { name: 'SENSEX', key: 'SENSEX' },
    { name: 'BANKNIFTY', key: 'BANKNIFTY' },
    { name: 'INDIA VIX', key: 'INDIAVIX' },
    { name: 'BRENT CRUDE', key: 'BRENT' },
    { name: 'USD/INR', key: 'USD/INR' },
    { name: 'GOLD', key: 'GOLD' },
    { name: 'SILVER', key: 'SILVER' },
    { name: 'COPPER', key: 'COPPER' },
  ];

  // FII/DII signal
  const fiiNet = fiiDii?.fii?.net;
  const diiNet = fiiDii?.dii?.net;
  const fiiSignal = fiiDii?.signal || 'NEUTRAL';
  const fiiSignalColor = fiiSignal === 'BULLISH' ? '#00FF88' : fiiSignal === 'BEARISH' ? '#FF4444' : '#FFB347';

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>

      {/* ══ SECTION 1: METRIC CARDS ══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 24,
        paddingBottom: 60, // Space for fixed ticker
      }}>
        {cards.map((c) => {
          const d = market[c.key];
          return (
            <MetricCard
              key={c.key}
              name={c.name}
              price={d?.price}
              change={d?.change}
              pChange={d?.pChange}
              direction={d?.direction || (d?.change >= 0 ? 'up' : 'down')}
            />
          );
        })}
      </div>

      {/* ══ SECTION 2: THREE PANELS ══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>

        {/* LEFT: FII/DII FLOW */}
        <div style={{
          background: '#0D0D1A',
          border: '1px solid #1A1A2E',
          borderRadius: 8,
          padding: 20,
        }}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 10,
            color: '#8892A0',
            letterSpacing: '0.15em',
            marginBottom: 16,
          }}>
            FII / DII FLOW
          </div>

          {fiiDii ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: '#8892A0', marginBottom: 4 }}>FII Net</div>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: fiiNet != null ? (fiiNet >= 0 ? '#00FF88' : '#FF4444') : '#555B66',
                }}>
                  {fiiNet != null ? <><AnimatedValue value={fiiNet} /> <span style={{ fontSize: 14 }}>Cr</span></> : 'N/A'}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: '#8892A0', marginBottom: 4 }}>DII Net</div>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: diiNet != null ? (diiNet >= 0 ? '#00FF88' : '#FF4444') : '#555B66',
                }}>
                  {diiNet != null ? <><AnimatedValue value={diiNet} /> <span style={{ fontSize: 14 }}>Cr</span></> : 'N/A'}
                </div>
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 700,
                color: fiiSignalColor,
                padding: '4px 10px',
                background: `${fiiSignalColor}15`,
                border: `1px solid ${fiiSignalColor}30`,
                borderRadius: 4,
                display: 'inline-block',
              }}>
                {fiiSignal}
              </div>
              {fiiDii?.date && fiiDii.date !== 'Unavailable' && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#555B66', marginTop: 8 }}>
                  Data: {fiiDii.date}
                </div>
              )}
              {fiiDii?.note === 'Volume proxy' ? (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#FFB347', marginTop: 4 }}>
                  Institutional proxy (volume-derived) — real FII data unavailable from cloud
                </div>
              ) : fiiDii?.unavailable ? (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#FF8C00', marginTop: 8 }}>
                  NSE API unavailable — check back later
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ color: '#555B66', fontFamily: "var(--font-mono)", fontSize: 11 }}>Loading...</div>
          )}
        </div>

        {/* CENTER: IRS WIDGET */}
        <IrsWidget irsData={irsData} history={irsHistory} />

        {/* RIGHT: SECTOR HEATMAP */}
        <SectorHeatmap sectors={sectors} />
      </div>

      {/* ══ SECTION 3: NEWS TICKER ══ */}
      <NewsTicker news={news} />
    </div>
  );
}
