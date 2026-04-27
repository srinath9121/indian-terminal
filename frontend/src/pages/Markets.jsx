import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

// ────── MOVERS TABLE ──────
function MoversTable({ title, data, type, flash }) {
  const bgTint = type === 'gainers' ? '#0A2010' : type === 'losers' ? '#200A0A' : '#1A1400';
  const accentColor = type === 'gainers' ? '#22C55E' : type === 'losers' ? '#EF4444' : '#EAB308';
  const icon = type === 'gainers' ? '▲' : type === 'losers' ? '▼' : '⚡';

  return (
    <div style={{
      background: '#0D0D1A',
      border: '1px solid #1A1A2E',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1A1A2E',
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        fontWeight: 700,
        color: accentColor,
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {icon} {title}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['SYMBOL', 'LTP', 'CHG%', 'VOLUME'].map(h => (
              <th key={h} style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: '#6B7280',
                textAlign: 'left',
                padding: '8px 12px',
                borderBottom: '1px solid #1A1A2E',
                letterSpacing: '0.05em',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!data || data.length === 0 ? (
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <tr key={i}>
                {[1, 2, 3, 4].map(j => (
                  <td key={j} style={{ padding: '8px 12px' }}>
                    <div className="skeleton-bar" style={{ height: 14, width: j === 1 ? 60 : 40 }} />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            data.slice(0, 10).map((item, i) => {
              // Calculate volume bar width if volume shockers
              const volRatio = item.volume_ratio || (item.volume / 100000) || 1;
              const barPct = Math.min(100, Math.max(10, volRatio * 10));

              return (
                <tr
                  key={i}
                  style={{
                    background: bgTint,
                    borderBottom: '1px solid #1A1A2E',
                    borderLeft: flash ? `2px solid ${accentColor}` : '2px solid transparent',
                    transition: 'all 0.6s ease',
                  }}
                >
                  <td style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    fontWeight: 700,
                  }}>
                    {item.symbol}
                  </td>
                  <td style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: '#D1D5DB',
                    padding: '8px 12px',
                  }}>
                    {item.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: accentColor,
                    padding: '8px 12px',
                  }}>
                    {item.pChange > 0 ? '+' : ''}{item.pChange?.toFixed(2)}%
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: type === 'volume' ? '#EAB308' : '#9CA3AF',
                    position: 'relative',
                  }}>
                    {type === 'volume' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{item.volume?.toLocaleString('en-IN')}</span>
                        <div style={{ width: 40, height: 4, background: '#1A1A2E', borderRadius: 2 }}>
                          <div style={{ width: `${barPct}%`, height: '100%', background: '#EAB308', borderRadius: 2 }} />
                        </div>
                      </div>
                    ) : (
                      item.volume?.toLocaleString('en-IN')
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ────── INDEX SPARKLINE CHART ──────
function IndexSparkline({ name, data, color }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 8,
        padding: 16, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div className="skeleton-bar" style={{ height: 80, width: '80%' }} />
      </div>
    );
  }

  const currentVal = data[data.length - 1]?.close || 0;
  const startVal = data[0]?.close || currentVal;
  const changePct = startVal > 0 ? ((currentVal - startVal) / startVal * 100).toFixed(2) : '0.00';
  const isUp = parseFloat(changePct) >= 0;
  const changeColor = isUp ? '#22C55E' : '#EF4444';

  return (
    <div style={{
      background: '#0D0D1A',
      border: '1px solid #1A1A2E',
      borderRadius: 8,
      padding: '16px 16px 0 16px',
      position: 'relative',
      height: 160,
    }}>
      {/* Top row: Title and Last Value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#D1D5DB', fontWeight: 700 }}>
          {name}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
            {currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: changeColor }}>
            {isUp ? '▲' : '▼'} {changePct}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 4, fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#FFF' }}
              itemStyle={{ color: color }}
              labelStyle={{ color: '#9CA3AF', marginBottom: 4 }}
              formatter={(value) => [value.toLocaleString('en-IN'), 'Close']}
              labelFormatter={(label) => data[label]?.date || ''}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color-${name})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════
// MARKETS PAGE
// ════════════════════════════════════════════════
export default function Markets() {
  const [movers, setMovers] = useState(null);
  const [sparklines, setSparklines] = useState(null);
  const [fiiHistory, setFiiHistory] = useState(null);
  const [mktStatus, setMktStatus] = useState(null);
  const [flash, setFlash] = useState(false);
  const [istTime, setIstTime] = useState('');
  const [countdown, setCountdown] = useState('');

  // ────── FETCH DATA ──────
  useEffect(() => {
    const fetchMovers = async () => {
      try {
        const r = await fetch('/api/market/movers');
        if (r.ok) {
          const d = await r.json();
          if (d.gainers) d.gainers.sort((a, b) => b.pChange - a.pChange);
          if (d.losers) d.losers.sort((a, b) => a.pChange - b.pChange);
          setMovers(d);
          setFlash(true);
          setTimeout(() => setFlash(false), 600);
        }
      } catch {}
    };

    const fetchSparklines = async () => {
      try {
        const r = await fetch('/api/index-sparklines');
        if (r.ok) setSparklines(await r.json());
      } catch {}
    };

    const fetchStatus = async () => {
      try {
        const r = await fetch('/api/market-status');
        if (r.ok) setMktStatus(await r.json());
      } catch {}
    };

    const fetchFiiHistory = async () => {
      try {
        const r = await fetch('/api/fii-history-chart');
        if (r.ok) setFiiHistory(await r.json());
      } catch {}
    };

    fetchMovers();
    fetchSparklines();
    fetchStatus();
    fetchFiiHistory();

    const moversInterval = setInterval(fetchMovers, 5 * 60 * 1000);
    const sparkInterval = setInterval(fetchSparklines, 5 * 60 * 1000);
    const statusInterval = setInterval(fetchStatus, 30 * 1000);

    return () => {
      clearInterval(moversInterval);
      clearInterval(sparkInterval);
      clearInterval(statusInterval);
    };
  }, []);

  // ────── CLIENT-SIDE CLOCK & COUNTDOWN ──────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // IST is UTC + 5:30
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (3600000 * 5.5));
      
      const hh = String(istDate.getHours()).padStart(2, '0');
      const mm = String(istDate.getMinutes()).padStart(2, '0');
      const ss = String(istDate.getSeconds()).padStart(2, '0');
      setIstTime(`${hh}:${mm}:${ss} IST`);

      // Compute market states and countdown
      const day = istDate.getDay();
      const h = istDate.getHours();
      const m = istDate.getMinutes();
      const timeNum = h * 100 + m; // e.g., 915

      if (day === 0 || day === 6) {
        setCountdown('Opens in --h --m (Weekend)');
        return;
      }

      if (timeNum < 900) {
        // Before pre-open
        let diffMinutes = (9 * 60) - (h * 60 + m);
        setCountdown(`Pre-open in ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`);
      } else if (timeNum >= 900 && timeNum < 915) {
        // Pre-open
        let diffMinutes = (9 * 60 + 15) - (h * 60 + m);
        setCountdown(`Opens in 0h ${diffMinutes}m`);
      } else if (timeNum >= 915 && timeNum < 1530) {
        // Open
        let diffMinutes = (15 * 60 + 30) - (h * 60 + m);
        setCountdown(`Closes in ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`);
      } else {
        // Post market
        setCountdown('Market Closed');
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Compute status presentation
  let statusColor = '#6B7280';
  let statusText = 'MARKET CLOSED';
  let dotClass = '';

  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const day = istDate.getDay();
  const timeNum = istDate.getHours() * 100 + istDate.getMinutes();

  if (day === 0 || day === 6) {
    statusText = 'MARKET CLOSED (Weekend)';
  } else if (timeNum >= 900 && timeNum < 915) {
    statusColor = '#F97316';
    statusText = 'MARKET PRE-OPEN';
    dotClass = 'live-dot-amber';
  } else if (timeNum >= 915 && timeNum < 1530) {
    statusColor = '#22C55E';
    statusText = 'MARKET OPEN';
    dotClass = 'live-dot'; // Green pulsing dot
  } else if (timeNum >= 1530 && timeNum < 1540) {
    statusColor = '#F97316';
    statusText = 'MARKET CLOSING';
    dotClass = 'live-dot-amber';
  }

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto', paddingBottom: 80 }}>

      {/* ══ ROW 1: THREE MOVERS COLUMNS ══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <MoversTable
          title="TOP GAINERS"
          data={movers?.gainers}
          type="gainers"
          flash={flash}
        />
        <MoversTable
          title="TOP LOSERS"
          data={movers?.losers}
          type="losers"
          flash={flash}
        />
        <MoversTable
          title="VOLUME SHOCKERS"
          data={movers?.volume_shockers}
          type="volume"
          flash={flash}
        />
      </div>

      {/* ══ ROW 2: INDEX SPARKLINES ══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}>
        <IndexSparkline name="NIFTY 50" data={sparklines?.NIFTY} color="#00D4FF" />
        <IndexSparkline name="SENSEX" data={sparklines?.SENSEX} color="#EAB308" />
        <IndexSparkline name="BANKNIFTY" data={sparklines?.BANKNIFTY} color="#A78BFA" />
      </div>

      {/* ══ ROW 3: FII HISTORY CHART ══ */}
      <div style={{
        background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 8, padding: 24, marginBottom: 24
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#D1D5DB', fontWeight: 700, marginBottom: 16 }}>
          FII NET FLOWS (30 DAYS)
        </div>
        <div style={{ height: 250 }}>
          {fiiHistory ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fiiHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#374151" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: "'Space Mono', monospace" }} />
                <YAxis stroke="#374151" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: "'Space Mono', monospace" }} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v} Cr`} />
                <Tooltip
                  cursor={{ fill: '#1A1A2E' }}
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 4, fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#FFF' }}
                  formatter={(val) => [`${val > 0 ? '+' : ''}${val} Cr`, 'FII Net']}
                />
                <Bar dataKey="fii_net" isAnimationActive={false}>
                  {fiiHistory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fii_net >= 0 ? '#22C55E' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>Loading FII History...</div>
          )}
        </div>
      </div>

      {/* ══ BOTTOM BAR: MARKET STATUS ══ */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#0D0D1A',
        borderTop: '1px solid #00D4FF',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        zIndex: 500,
      }}>
        {/* STATUS DOT */}
        <div className={dotClass} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: !dotClass ? '#6B7280' : undefined
        }} />
        
        {/* STATUS TEXT */}
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: statusColor }}>
          {statusText}
        </span>

        {/* DIVIDER */}
        <span style={{ color: '#1A1A2E' }}>|</span>

        {/* NEXT EVENT */}
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF' }}>
          {countdown}
        </span>

        {/* DIVIDER */}
        <span style={{ color: '#1A1A2E' }}>|</span>

        {/* IST TIME */}
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF' }}>
          {istTime}
        </span>
      </div>
    </div>
  );
}
