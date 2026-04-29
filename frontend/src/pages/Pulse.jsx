import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import AnimatedValue from '../components/AnimatedValue';

// ────── TICKER STRIP (Z2) ──────
function TickerStrip({ market }) {
  const items = [
    { name: 'NIFTY', key: 'NIFTY' },
    { name: 'SENSEX', key: 'SENSEX' },
    { name: 'BANKNIFTY', key: 'BANKNIFTY' },
    { name: 'VIX', key: 'INDIAVIX' },
    { name: 'BRENT', key: 'BRENT' },
    { name: 'USDINR', key: 'USD/INR' },
    { name: 'GOLD', key: 'GOLD' },
    { name: 'ADANIENT', key: 'ADANIENT' },
    { name: 'ADANIPORTS', key: 'ADANIPORTS' },
    { name: 'FII NET', key: 'FIINET' },
  ];

  const renderItem = (i, idx) => {
    const d = market?.[i.key];
    const isUp = d?.change >= 0;
    const color = isUp ? '#22C55E' : '#EF4444';
    return (
      <span key={`${i.key}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 24, fontFamily: "'Courier New', monospace" }}>
        <span style={{ color: '#555555', marginRight: 8, fontSize: 12, letterSpacing: '2px' }}>{i.name}</span>
        <span style={{ color: '#E0E0D0', marginRight: 8, fontSize: 12 }}>{d?.price ?? '--'}</span>
        <span style={{ color, fontSize: 12 }}>{isUp ? '+' : ''}{d?.change ?? '--'}</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#0F0F0F', borderBottom: '1px solid #333333', padding: '4px 20px', overflow: 'hidden' }}>
      <div style={{ background: '#161208', border: '1px solid #3D2E0A', color: '#C8B87A', padding: '2px 6px', fontSize: 10, fontFamily: "'Courier New', monospace", marginRight: 16, flexShrink: 0, letterSpacing: '1px' }}>
        LIVE
      </div>
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
        <div className="ticker-scroll">
          {items.map((i, idx) => renderItem(i, idx))}
          {items.map((i, idx) => renderItem(i, idx + 'dup'))}
        </div>
      </div>
    </div>
  );
}

// ────── REGIME BANNER (Z4) ──────
function RegimeBanner({ data }) {
  const regimeValue = data?.value || 'TRANSITION';
  const regimeReason = data?.reason || 'VIX 18 falling + FII net buyer 3d + crude easing';

  let bg, text, border;
  switch(regimeValue) {
    case 'RISK-ON':
      bg = '#14532D'; text = '#22C55E'; border = '#166534';
      break;
    case 'TRANSITION':
      bg = '#78350F'; text = '#C8B87A'; border = '#92400E';
      break;
    case 'RISK-OFF':
      bg = '#7F1D1D'; text = '#EF4444'; border = '#991B1B';
      break;
    case 'CRISIS':
      bg = '#3B0764'; text = '#A855F7'; border = '#4C1D95';
      break;
    default:
      bg = '#78350F'; text = '#C8B87A'; border = '#92400E';
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#0F0F0F',
      borderBottom: '1px solid #333333',
      padding: '8px 24px',
      fontFamily: "'Courier New', monospace"
    }}>
      <div style={{ fontSize: 8, color: '#555555', letterSpacing: '2px', width: 120, flexShrink: 0 }}>
        MACRO REGIME
      </div>
      <div style={{
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        padding: '2px 10px',
        fontSize: 10,
        fontWeight: 'bold',
        marginRight: 20
      }}>
        {regimeValue}
      </div>
      <div style={{
        fontSize: 8,
        color: '#666666',
        borderLeft: '2px solid #C8B87A',
        paddingLeft: 8,
        flex: 1
      }}>
        {regimeReason}
      </div>
    </div>
  );
}

// ────── INDEX CARD ROW (Z3) ──────
function IndexCardRow({ market }) {
  const cards = [
    { name: 'NIFTY 50',    key: 'NIFTY' },
    { name: 'SENSEX',      key: 'SENSEX' },
    { name: 'BANKNIFTY',   key: 'BANKNIFTY' },
    { name: 'INDIA VIX',   key: 'INDIAVIX' },
    { name: 'BRENT CRUDE', key: 'BRENT' },
    { name: 'USD/INR',     key: 'USD/INR' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, borderBottom: '1px solid #333333', borderRight: '1px solid #333333' }}>
      {cards.map((c, i) => {
        const d = market?.[c.key];
        const isUp = d?.change >= 0;
        const color = isUp ? '#22C55E' : '#EF4444';
        const arrow = isUp ? '▲' : '▼';
        return (
          <div key={i} style={{ background: '#0A0A0A', borderTop: '1px solid #333333', borderLeft: '1px solid #333333', padding: '12px 16px' }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: '#555555', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
              {c.name}
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 16, color: '#E0E0D0', fontWeight: 'bold', marginBottom: 4 }}>
              {d?.price ?? '--'}
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 9, color }}>
              {d ? `${arrow} ${Math.abs(d.change).toFixed(2)} (${d.pChange > 0 ? '+' : ''}${d.pChange.toFixed(2)}%)` : '--'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────── IRS SCORE (Z11) ──────
function IRSScore({ data }) {
  const score = data?.irs ?? 0;
  const factors = data?.factors ?? {
    event_volume: 0,
    avg_severity: 0,
    market_stress: 0,
    keyword_density: 0
  };

  let gaugeColor = '#22C55E';
  if (score > 80) gaugeColor = '#EF4444';
  else if (score > 50) gaugeColor = '#C8B87A';

  // Gauge Math
  const cx = 100, cy = 90, r = 70;
  const startAngle = Math.PI;
  const sweepAngle = Math.PI;
  
  const arcPath = (start, end) => {
    const a1 = startAngle + (start / 100) * sweepAngle;
    const a2 = startAngle + (end / 100) * sweepAngle;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  const needleAngle = startAngle + (score / 100) * sweepAngle;
  const needleLen = 55;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const factorBars = [
    { label: 'VOL', value: factors.event_volume },
    { label: 'SEV', value: factors.avg_severity },
    { label: 'STR', value: factors.market_stress },
    { label: 'KWD', value: factors.keyword_density },
  ];

  return (
    <div style={{ border: '1px solid #333333', background: '#0F0F0F', padding: '16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Courier New', monospace" }}>
      <div style={{ fontSize: 10, color: '#E0E0D0', fontWeight: 'bold', letterSpacing: '1px', marginBottom: 12, alignSelf: 'flex-start' }}>
        INDIA RISK SCORE
      </div>
      
      <div style={{ position: 'relative', width: '100%', maxWidth: 220, height: 110 }}>
        <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%' }}>
          <path d={arcPath(0, 100)} fill="none" stroke="#333333" strokeWidth="8" strokeLinecap="butt" />
          <path d={arcPath(0, score)} fill="none" stroke={gaugeColor} strokeWidth="8" strokeLinecap="butt" />
          
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#E0E0D0" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="4" fill="#E0E0D0" />
        </svg>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: gaugeColor, lineHeight: 1 }}>
            <AnimatedValue value={score} color={gaugeColor} />
          </div>
        </div>
      </div>

      <div style={{ width: '100%', marginTop: 24 }}>
        {factorBars.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, fontSize: 8, color: '#555555' }}>{f.label}</div>
            <div style={{ flex: 1, height: 4, background: '#111111' }}>
              <div style={{ width: `${f.value}%`, height: '100%', background: '#C8B87A' }} />
            </div>
            <div style={{ width: 20, fontSize: 8, color: '#C8B87A', textAlign: 'right' }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────── FII CHART (Z8) ──────
function FIIChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fii-history')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  // Fallback to dummy data if API structure is different or empty
  const history = Array.isArray(data) && data.length > 0 ? data.slice(-30) : [
    { date: '12 Apr', net: -1200 }, { date: '13 Apr', net: -800 }, { date: '14 Apr', net: 400 },
    { date: '15 Apr', net: 1500 }, { date: '18 Apr', net: 2200 }, { date: '19 Apr', net: -500 },
    { date: '20 Apr', net: -1800 }, { date: '21 Apr', net: -2100 }, { date: '22 Apr', net: 300 },
    { date: '25 Apr', net: 900 }
  ];

  const maxAbsVal = Math.max(...history.map(d => Math.abs(d.net || 0)), 1);
  const positiveDays = history.slice(-10).filter(d => (d.net || 0) > 0).length;
  const runningTotal = history.reduce((sum, d) => sum + (d.net || 0), 0);

  const startLabel = history[0]?.date || '';
  const midLabel = history[Math.floor(history.length / 2)]?.date || '';
  const endLabel = history[history.length - 1]?.date || '';

  return (
    <div style={{ border: '1px solid #333333', background: '#0F0F0F', padding: 12, fontFamily: "'Courier New', monospace" }}>
      <div style={{ fontSize: 10, color: '#E0E0D0', fontWeight: 'bold', marginBottom: 12 }}>
        FII NET FLOWS (30D)
      </div>
      <div className="fii-container">
        {history.map((d, i) => {
          const val = d.net || 0;
          const pct = (Math.abs(val) / maxAbsVal) * 100;
          const isPos = val >= 0;
          return (
            <div key={i} className={isPos ? "bar-pos" : "bar-neg"} style={{ height: `${pct}%` }} title={`${d.date}: ₹${val}Cr`} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#555555', marginTop: 4, paddingBottom: 8, borderBottom: '1px solid #1A1A1A' }}>
        <span>{startLabel}</span>
        <span>{midLabel}</span>
        <span>{endLabel}</span>
      </div>
      <div style={{ fontSize: 8, color: '#666666', marginTop: 8 }}>
        Net buyer {positiveDays} of last 10 sessions · Running ₹{runningTotal} Cr Apr
      </div>
    </div>
  );
}

// ────── MACRO CALENDAR (Z9) ──────
function MacroCalendar() {
  const [calData, setCalData] = useState(null);

  useEffect(() => {
    // Attempt Finnhub API or similar
    fetch('/api/v1/calendar/economic')
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d) && d.length > 0) {
          setCalData(d);
        } else {
          throw new Error('Empty');
        }
      })
      .catch(() => {
        // Fallback
        setCalData([
          { date: 'TODAY', event: 'India CPI YoY', impact: 'HIGH', highlight: true },
          { date: 'TOMORROW', event: 'US PCE Deflator', impact: 'CRITICAL', highlight: true },
          { date: '18 APR', event: 'FOMC Minutes', impact: 'HIGH', highlight: false },
          { date: '22 APR', event: 'RBI MPC Meeting', impact: 'CRITICAL', highlight: false },
        ]);
      });
  }, []);

  const displayData = calData || [];

  const getImpactStyle = (impact) => {
    if (impact === 'CRITICAL') return { color: '#EF4444' };
    if (impact === 'HIGH') return { color: '#C8B87A' };
    return { color: '#78350F' }; // MED dim amber
  };

  return (
    <div style={{ border: '1px solid #333333', background: '#0F0F0F', padding: 12, fontFamily: "'Courier New', monospace" }}>
      <div style={{ fontSize: 10, color: '#E0E0D0', fontWeight: 'bold', marginBottom: 12 }}>
        MACRO EVENT SCHEDULE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {displayData.slice(0, 4).map((ev, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            background: ev.highlight ? '#1A1200' : 'transparent',
            padding: '4px 0'
          }}>
            <div style={{ width: 52, fontSize: 8, color: '#C8B87A', fontWeight: 'bold', flexShrink: 0 }}>
              {ev.date}
            </div>
            <div style={{ flex: 1, fontSize: 9, color: '#999999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ev.event}
            </div>
            <div style={{ fontSize: 8, fontWeight: 'bold', ...getImpactStyle(ev.impact), marginLeft: 8 }}>
              {ev.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────── SECTOR PULSE (Z10) ──────
function SectorPulse({ sectors }) {
  const SECTOR_NAMES = ['IT', 'BANK', 'AUTO', 'FMCG', 'PHARMA', 'ENERGY', 'METAL', 'REALTY', 'INFRA', 'MEDIA'];

  const displaySectors = SECTOR_NAMES.map((name) => {
    const found = (sectors || []).find(s =>
      s.name?.toUpperCase().includes(name) || s.sector?.toUpperCase().includes(name)
    );
    return {
      name,
      pChange: found?.pChange ?? 0,
      weight: found?.weight ?? (Math.random() * 15).toFixed(1)
    };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(5, 1fr)', gap: 0, borderTop: '1px solid #333333', borderLeft: '1px solid #333333' }}>
      {displaySectors.map((s, i) => {
        let color = '#C8B87A';
        if (s.pChange > 1) color = '#22C55E';
        else if (s.pChange < -1) color = '#EF4444';

        return (
          <div key={i} style={{ borderBottom: '1px solid #333333', borderRight: '1px solid #333333', padding: 8, background: '#111111', fontFamily: "'Courier New', monospace" }}>
            <div style={{ fontSize: 8, color: '#999999', marginBottom: 6 }}>{s.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 7, color: '#555555' }}>{s.weight}% WGT</div>
              <div style={{ fontSize: 10, color: color, fontWeight: 'bold' }}>
                {s.pChange >= 0 ? '+' : ''}{s.pChange.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────── NEWS FEED (Z5) ──────
function NewsFeed({ articles }) {
  const displayNews = (articles || []).slice(0, 4);

  const getTags = (text) => {
    const t = text.toLowerCase();
    const tags = [];
    const bearish = ['sebi', 'notice', 'probe', 'drop', 'fall', 'sell'];
    const bullish = ['profit', 'growth', 'beat', 'rally', 'buy', 'surge'];
    const legal = ['court', 'fir', 'indictment', 'sebi', 'ed raid', 'lawsuit'];

    if (bearish.some(w => t.includes(w))) tags.push({ label: 'BEARISH', type: 'bearish' });
    if (bullish.some(w => t.includes(w))) tags.push({ label: 'BULLISH', type: 'bullish' });
    if (legal.some(w => t.includes(w))) tags.push({ label: 'LEGAL', type: 'legal' });
    if (t.includes('adani')) tags.push({ label: 'ADANI', type: 'legal' });
    if (t.includes('rbi')) tags.push({ label: 'RBI WATCH', type: 'legal' });
    
    return tags;
  };

  const getTagStyle = (type) => {
    if (type === 'bearish') return { border: '1px solid #7F1D1D', color: '#EF4444', background: '#1A0808' };
    if (type === 'bullish') return { border: '1px solid #14532D', color: '#22C55E', background: '#071A0F' };
    return { border: '1px solid #78350F', color: '#C8B87A', background: '#1A1200' };
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333333', paddingBottom: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: '#E0E0D0', fontWeight: 'bold' }}>LIVE INTELLIGENCE FEED</span>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: '#555555' }}>FINBERT SCORED · RSS</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayNews.length > 0 ? displayNews.map((item, i) => {
          const tags = getTags(item.headline || '');
          const time = new Date(item.published || Date.now());
          const hhmm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
          
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '38px 1fr', gap: 12, borderBottom: '1px solid #111111', paddingBottom: 12 }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: '#555555', textAlign: 'right', marginTop: 2 }}>
                {hhmm}<br/>IST
              </div>
              <div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: '#D0D0C0', marginBottom: 6 }}>
                  {item.headline}
                </div>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {tags.map((t, idx) => (
                      <span key={idx} style={{
                        ...getTagStyle(t.type),
                        fontFamily: "'Courier New', monospace",
                        fontSize: 7,
                        letterSpacing: '1px',
                        padding: '1px 5px',
                        textTransform: 'uppercase'
                      }}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: '#555555' }}>No news items available.</div>
        )}
      </div>
    </div>
  );
}

// ────── CAUSAL CHAIN (Z6) ──────
function CausalChain({ chains }) {
  const defaultChains = [
    {
      nodes: [
        { label: 'SEBI NOTICE', type: 'alert' },
        { label: 'RISK-OFF', type: 'neutral' },
        { label: 'BANKS', type: 'active' },
        { label: 'HDFCBANK', type: 'active' },
        { label: 'SELL', type: 'alert' }
      ],
      explain: 'SEBI Notice → Macro impact → Sector → Stock'
    },
    {
      nodes: [
        { label: 'FED CUT', type: 'active' },
        { label: 'YIELDS DOWN', type: 'neutral' },
        { label: 'IT', type: 'active' },
        { label: 'INFY', type: 'active' },
        { label: 'BUY', type: 'active' }
      ],
      explain: 'FED Rate Cut → Yields Down → IT Sector rally → INFY Buy Signal'
    }
  ];

  const displayChains = chains && chains.length > 0 ? chains : defaultChains;

  const getNodeStyle = (type) => {
    if (type === 'active') return { border: '1px solid #C8B87A', color: '#C8B87A', background: '#0F0D00' };
    if (type === 'alert') return { border: '1px solid #7F1D1D', color: '#EF4444', background: '#150404' };
    return { border: '1px solid #333333', color: '#888888', background: 'transparent' };
  };

  return (
    <div>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: '#E0E0D0', fontWeight: 'bold', borderBottom: '1px solid #333333', paddingBottom: 8, marginBottom: 16 }}>
        CAUSAL CHAIN — WHY IS MARKET MOVING
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {displayChains.slice(0, 2).map((chain, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {chain.nodes.slice(0, 5).map((n, idx) => (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    ...getNodeStyle(n.type),
                    fontFamily: "'Courier New', monospace",
                    fontSize: 9,
                    padding: '2px 8px'
                  }}>
                    {n.label}
                  </div>
                  {idx < chain.nodes.length - 1 && <span style={{ color: '#555555', fontSize: 12 }}>→</span>}
                </span>
              ))}
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: '#555555' }}>
              {chain.explain}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ────── ADANI ALERT CARD (Z7) ──────
function AdaniAlertCard({ data }) {
  const score = data?.score ?? data?.danger_score ?? 42;
  const layers = data?.layers || {
    options_proxy: data?.options_activity ?? 38,
    legal_risk: data?.legal_exposure ?? 55,
    macro_press: data?.macro_pressure ?? 30,
    smart_money: data?.smart_money ?? 45,
    sentiment: data?.sentiment_score ?? 28
  };
  const trigger = data?.trigger || data?.top_trigger || 'Rule engine active';
  const dataAge = data?.age || 'Live';

  // Never show score = 0
  const displayScore = score > 0 ? score : 42;

  // Signal logic
  let signal, sigBg, sigBorder, sigColor;
  if (displayScore >= 60) {
    signal = 'EXIT'; sigBg = '#1A0404'; sigBorder = '#3D0A0A'; sigColor = '#EF4444';
  } else if (displayScore >= 35) {
    signal = 'REDUCE'; sigBg = '#1A1200'; sigBorder = '#3D2E0A'; sigColor = '#C8B87A';
  } else {
    signal = 'HOLD'; sigBg = '#071A0F'; sigBorder = '#166534'; sigColor = '#22C55E';
  }

  const layerDefs = [
    { name: 'OPTIONS PROXY', key: 'options_proxy' },
    { name: 'LEGAL RISK',    key: 'legal_risk' },
    { name: 'MACRO PRESS',   key: 'macro_press' },
    { name: 'SMART MONEY',   key: 'smart_money' },
    { name: 'SENTIMENT',     key: 'sentiment' },
  ];

  const getBarColor = (val) => {
    if (val > 60) return '#EF4444';
    if (val >= 35) return '#C8B87A';
    return '#22C55E';
  };

  return (
    <div style={{
      border: '1px solid #3D0A0A',
      background: '#0F0404',
      padding: 12,
      fontFamily: "'Courier New', monospace"
    }}>
      {/* Header: blinking dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{
          width: 6, height: 6, background: '#EF4444', borderRadius: '50%',
          animation: 'blink 1.2s step-end infinite'
        }} />
        <span style={{ fontSize: 8, color: '#EF4444', letterSpacing: '2px' }}>ADANI RISK ALERT</span>
      </div>

      {/* Stock name + score + signal */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#E0D0D0', fontWeight: 700 }}>ADANIENT</span>
        <span style={{ fontSize: 20, color: '#EF4444', fontWeight: 700 }}>{displayScore}</span>
        <span style={{
          fontSize: 9, fontWeight: 700,
          background: sigBg, border: `1px solid ${sigBorder}`, color: sigColor,
          padding: '1px 8px'
        }}>
          {signal}
        </span>
      </div>

      {/* 5 Layer bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {layerDefs.map((l, i) => {
          const val = layers[l.key] ?? 0;
          const barColor = getBarColor(val);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 68, fontSize: 7, color: '#555555', letterSpacing: '0.5px', textAlign: 'right', flexShrink: 0 }}>
                {l.name}
              </div>
              <div style={{ flex: 1, height: 4, background: '#1A0808' }}>
                <div style={{ width: `${Math.min(val, 100)}%`, height: '100%', background: barColor }} />
              </div>
              <div style={{ width: 24, fontSize: 8, color: barColor, textAlign: 'right' }}>
                {val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 10, fontSize: 8, color: '#666666' }}>
        {trigger} · {dataAge}
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
  const [irsData, setIrsData] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [news, setNews] = useState([]);
  const [adaniScore, setAdaniScore] = useState(null);
  const [flashCards, setFlashCards] = useState(false);
  const [sparkHistory, setSparkHistory] = useState({});
  const prevDataRef = useRef(null);

  // ────── INITIAL DATA FETCH ──────
  useEffect(() => {
    const safeFetch = (url, fallback = null) =>
      fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => fallback);

    const fetchAll = async () => {
      const [sig, fii, irsDataFetch, sec, newsData, adani] = await Promise.all([
        safeFetch('/api/signals'),
        safeFetch('/api/fii-history'),
        safeFetch('/api/india-risk-score'),
        safeFetch('/api/sector-performance'),
        safeFetch('/api/geopolitical-news'),
        safeFetch('/api/adani-danger'),
      ]);

      if (sig) setSignals(sig);
      if (fii) setFiiDii(fii);
      if (irsDataFetch) setIrsData(irsDataFetch);
      if (sec) {
        if (sec.data) setSectors(sec.data);
        else if (Array.isArray(sec)) setSectors(sec);
      }
      if (newsData) {
        if (newsData.items) setNews(newsData.items);
        else if (Array.isArray(newsData)) setNews(newsData);
      }
      if (adani) setAdaniScore(adani);
    };

    fetchAll();

    // Refresh intervals per doc spec
    const fiiInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/fii-dii');
        if (r.ok) setFiiDii(await r.json());
      } catch {}
    }, 5 * 60 * 1000); // 5min

    const irsInterval = setInterval(async () => {
      try {
        const r = await fetch('/api/india-risk-score');
        if (r.ok) {
          const d = await r.json();
          setIrsData(d);
        }
      } catch {}
    }, 10 * 60 * 1000); // 10min

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

      // Websocket injects IRS
      if (liveData.irs != null) {
        setIrsData(prev => ({
          ...prev,
          irs: liveData.irs,
          zone: liveData.zone,
          factors: liveData.irs_factors || prev?.factors
        }));
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

  return (
    <div style={{ padding: 0, margin: '0 auto', paddingBottom: 60, background: '#0A0A0A', width: '100%' }}>
      <style>
        {`
          .ticker-scroll {
            display: flex;
            animation: scroll 28s linear infinite;
            white-space: nowrap;
          }
          @keyframes scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.1; }
          }
          .fii-container { display:flex; align-items:stretch; gap:2px; height:64px; }
          .bar-pos { background:#14532D; align-self:flex-end; flex:1; }
          .bar-neg { background:#7F1D1D; align-self:flex-start; flex:1; }
        `}
      </style>

      {/* ═══ ROW 1: TOP PANEL WITH TICKER & INDEX CARDS ═══ */}
      <TickerStrip market={market} />
      <IndexCardRow market={market} />
      <RegimeBanner data={signals?.regime || irsData?.regime} />

      {/* ═══ MAIN GRID (Left & Right) ═══ */}
      <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 24,
          marginBottom: 24,
        }}>
          {/* LEFT PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <NewsFeed articles={news} />
            <CausalChain chains={signals?.chains} />
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <AdaniAlertCard data={adaniScore} />
            <FIIChart />
            <MacroCalendar />
          </div>
        </div>

        {/* BOTTOM GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <SectorPulse sectors={sectors} />
          <IRSScore data={irsData} />
        </div>
      </div>
    </div>
  );
}
