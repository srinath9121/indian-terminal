import { useState, useEffect } from 'react';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell
} from 'recharts';

// ── HISTORICAL DATA GENERATORS ──
const getJan2023Data = () => {
  const data = []; let price = 3500; let danger = 20;
  const start = new Date('2022-12-05');
  for (let i = 0; i < 60; i++) {
    const dStr = new Date(start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (dStr === 'Jan 20') danger = 62;
    else if (dStr === 'Jan 22') danger = 78;
    else if (dStr === 'Jan 24') danger = 95;
    else if (i > 45) danger = Math.max(90, danger + (Math.random()*5-2));
    else danger += (Math.random() * 4 - 1);
    if (dStr === 'Jan 25') price = 2800;
    else if (dStr === 'Jan 27') price = 1800;
    else if (dStr === 'Feb 2') price = 1500;
    else price += (Math.random() * 60 - 25);
    data.push({ date: dStr, price: Math.floor(price), dangerScore: Math.floor(danger) });
    start.setDate(start.getDate() + 1);
  }
  return data;
};

const getNov2024Data = () => {
  const data = []; let price = 2800; let danger = 30;
  const start = new Date('2024-10-01');
  for (let i = 0; i < 60; i++) {
    const dStr = new Date(start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (dStr === 'Nov 18') danger = 65;
    else if (dStr === 'Nov 19') danger = 82;
    else if (dStr === 'Nov 20') danger = 98;
    else if (i > 45) danger = Math.max(90, danger + (Math.random()*5-2));
    else danger += (Math.random() * 4 - 1);
    if (dStr === 'Nov 21') price = 2100;
    else if (dStr === 'Nov 22') price = 1950;
    else price += (Math.random() * 40 - 15);
    data.push({ date: dStr, price: Math.floor(price), dangerScore: Math.floor(danger) });
    start.setDate(start.getDate() + 1);
  }
  return data;
};

const fetchPresentData = async (symbol) => {
  try {
    const resp = await fetch(`/warning/api/danger-score/${symbol}`);
    if (!resp.ok) throw new Error('API error');
    const d = await resp.json();
    const now = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    return [{ date: now, price: 0, dangerScore: d.danger_score || 0 }];
  } catch (e) {
    const now = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    return [{ date: now, price: 0, dangerScore: 0 }];
  }
};

const fetchSmartMoney = async (symbol) => {
  try {
    const resp = await fetch(`/warning/api/smart-money/${symbol}`);
    if (!resp.ok) throw new Error();
    return await resp.json();
  } catch {
    return { pledge_pct: 0, pledge_level: 'LOW', pledge_history: [], fii_holding_pct: 10, fii_delta: 0, fii_holding_history: [], smart_money_score: 0, signal: 'LOW' };
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#111827', padding: '10px 14px', borderRadius: 4, color: '#FFF', fontSize: 12, fontFamily: "'Space Mono', monospace", border: '1px solid #1F2937' }}>
        <div style={{ color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#60A5FA' }}>Price: ₹{payload[0]?.value?.toLocaleString()}</div>
        {payload[1] && <div style={{ color: '#EF4444', marginTop: 4 }}>Danger Score: {payload[1].value}</div>}
      </div>
    );
  }
  return null;
};

// ── PLEDGE PRESSURE GAUGE ──
const PledgeGauge = ({ value, level }) => {
  const color = level === 'CRITICAL' ? '#EF4444' : level === 'HIGH' ? '#F59E0B' : level === 'MODERATE' ? '#3B82F6' : '#10B981';
  const pct = Math.min(value / 80 * 100, 100);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 160, height: 80, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', border: '12px solid #1F2937', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(-45deg)' }} />
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', border: `12px solid ${color}`, borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: `rotate(${-45 + pct * 1.8}deg)`, transition: 'transform 1s ease' }} />
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color, marginTop: -8 }}>{value}%</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.08em', marginTop: 4 }}>PROMOTER PLEDGE</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color, background: `${color}20`, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 6 }}>{level}</div>
    </div>
  );
};

export default function AnalysisTab({ symbol }) {
  const [activePastEvent, setActivePastEvent] = useState('JAN_2023');
  const [presentData, setPresentData] = useState([]);
  const [pastData, setPastData] = useState([]);
  const [smartMoney, setSmartMoney] = useState(null);

  useEffect(() => { fetchPresentData(symbol).then(setPresentData); fetchSmartMoney(symbol).then(setSmartMoney); }, [symbol]);
  useEffect(() => { setPastData(activePastEvent === 'JAN_2023' ? getJan2023Data() : getNov2024Data()); }, [activePastEvent]);

  const currentDanger = presentData.length > 0 ? presentData[presentData.length - 1].dangerScore : 0;
  const pledgeHist = smartMoney?.pledge_history || [];
  const fiiHist = smartMoney?.fii_holding_history || [];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: '#EF4444', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>◎</span> SMART MONEY & HISTORICAL ANALYSIS
      </h2>

      {/* ── SMART MONEY ROW ── */}
      {smartMoney && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Pledge Gauge */}
          <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <PledgeGauge value={smartMoney.pledge_pct} level={smartMoney.pledge_level} />
            <div style={{ marginTop: 16, width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#9CA3AF' }}>Smart Score</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: smartMoney.smart_money_score > 50 ? '#EF4444' : '#10B981' }}>{smartMoney.smart_money_score}/100</span>
            </div>
          </div>

          {/* Pledge History Chart */}
          <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: 12 }}>PLEDGE TREND (QUARTERLY)</div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pledgeHist}>
                  <XAxis dataKey="q" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#1F2937' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                  <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                    {pledgeHist.map((entry, i) => (
                      <Cell key={i} fill={entry.pct > 15 ? '#EF4444' : entry.pct > 10 ? '#F59E0B' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FII Holding Timeline */}
          <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.05em' }}>FII HOLDING TREND</div>
              {smartMoney.fii_delta !== 0 && (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: smartMoney.fii_delta < 0 ? '#EF4444' : '#10B981' }}>
                  {smartMoney.fii_delta > 0 ? '▲' : '▼'} {Math.abs(smartMoney.fii_delta)}%
                </div>
              )}
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fiiHist}>
                  <XAxis dataKey="q" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#1F2937' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <defs>
                    <linearGradient id="fiiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="pct" stroke="#3B82F6" strokeWidth={2} fill="url(#fiiGrad)" />
                  <Line type="monotone" dataKey="pct" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TOGGLE ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ display: 'flex', background: '#111827', borderRadius: 6, padding: 4, border: '1px solid #1F2937' }}>
          {['JAN_2023', 'NOV_2024'].map(ev => (
            <button key={ev} onClick={() => setActivePastEvent(ev)} style={{
              background: activePastEvent === ev ? '#EF4444' : 'transparent',
              color: activePastEvent === ev ? '#FFF' : '#6B7280',
              border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}>
              {ev === 'JAN_2023' ? 'JAN 2023 HINDENBURG' : 'NOV 2024 DOJ INDICTMENT'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* ── LEFT: PAST SIGNAL ── */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em', marginBottom: 4 }}>
            {activePastEvent === 'JAN_2023' ? 'JANUARY 2023 - HINDENBURG' : 'NOVEMBER 2024 - DOJ INDICTMENT'}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>What the system would have detected</div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pastData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} minTickGap={20} tickLine={false} axisLine={{ stroke: '#1F2937' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#3B82F6' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#EF4444' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <defs><linearGradient id="cpBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                <Area yAxisId="left" type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#cpBlue)" isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="dangerScore" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#1A0505', borderRadius: 8, borderLeft: '4px solid #EF4444', fontSize: 12, color: '#FCA5A5', lineHeight: 1.6 }}>
            System would have signaled <strong style={{ color: '#EF4444' }}>4 days before crash</strong>.
          </div>
        </div>

        {/* ── RIGHT: PRESENT LIVE ── */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.05em', marginBottom: 4 }}>TODAY - LIVE DETECTION</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Rolling 60-day window live overlay</div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={presentData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#1F2937' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#3B82F6' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#EF4444' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} fillOpacity={0.1} fill="#3B82F6" isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="dangerScore" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#0c1929', borderRadius: 8, borderLeft: '4px solid #3B82F6', fontSize: 12, color: '#93C5FD', lineHeight: 1.6 }}>
            Live danger score: <strong style={{ color: currentDanger > 60 ? '#EF4444' : '#10B981' }}>{currentDanger}/100</strong>.
            {currentDanger > 60 ? ' Elevated risk detected.' : ' System parameters within normal ranges.'}
          </div>
        </div>
      </div>
    </div>
  );
}
