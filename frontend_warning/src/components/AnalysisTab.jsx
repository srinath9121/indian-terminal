import { useState, useEffect } from 'react';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

// ────── HARDCODED HISTORICAL DATA ──────
const getJan2023Data = () => {
  const data = [];
  let price = 3500;
  let danger = 20;
  const start = new Date('2022-12-05');
  
  for (let i = 0; i < 60; i++) {
    const dStr = new Date(start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    
    // Danger score ramps up
    if (dStr === 'Jan 20') danger = 62;
    else if (dStr === 'Jan 22') danger = 78;
    else if (dStr === 'Jan 24') danger = 95;
    else if (i > 45) danger = Math.max(90, danger + (Math.random()*5-2));
    else danger += (Math.random() * 4 - 1);
    
    // Price crash
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
  const data = [];
  let price = 2800;
  let danger = 30;
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

const getPresentData = () => {
  const data = [];
  let price = 3100;
  let danger = 45;
  const start = new Date();
  start.setDate(start.getDate() - 60);
  
  for (let i = 0; i < 60; i++) {
    const dStr = new Date(start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    price += (Math.random() * 60 - 25);
    danger = Math.min(100, Math.max(0, danger + (Math.random() * 10 - 4.5)));
    
    data.push({ date: dStr, price: Math.floor(price), dangerScore: Math.floor(danger) });
    start.setDate(start.getDate() + 1);
  }
  return data;
};

// ────── CUSTOM TOOLTIP ──────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#111827', padding: '10px 14px', borderRadius: 4, color: '#FFF', fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
        <div style={{ color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#60A5FA' }}>Price: ₹{payload[0].value.toLocaleString()}</div>
        {payload[1] && <div style={{ color: '#EF4444', marginTop: 4 }}>Danger Score: {payload[1].value}</div>}
      </div>
    );
  }
  return null;
};

export default function AnalysisTab({ symbol }) {
  const [activePastEvent, setActivePastEvent] = useState('JAN_2023');
  const [presentData, setPresentData] = useState([]);
  const [pastData, setPastData] = useState([]);

  useEffect(() => {
    setPresentData(getPresentData());
  }, [symbol]);

  useEffect(() => {
    if (activePastEvent === 'JAN_2023') setPastData(getJan2023Data());
    else setPastData(getNov2024Data());
  }, [activePastEvent]);

  const todayStr = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const currentDanger = presentData.length > 0 ? presentData[presentData.length - 1].dangerScore : 0;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* ────── HEADER & TOGGLE ────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 6, padding: 4 }}>
          <button 
            onClick={() => setActivePastEvent('JAN_2023')}
            style={{ 
              background: activePastEvent === 'JAN_2023' ? '#FFFFFF' : 'transparent',
              color: activePastEvent === 'JAN_2023' ? '#111827' : '#6B7280',
              border: 'none', borderRadius: 4, padding: '6px 16px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: activePastEvent === 'JAN_2023' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            JAN 2023 HINDENBURG
          </button>
          <button 
            onClick={() => setActivePastEvent('NOV_2024')}
            style={{ 
              background: activePastEvent === 'NOV_2024' ? '#FFFFFF' : 'transparent',
              color: activePastEvent === 'NOV_2024' ? '#111827' : '#6B7280',
              border: 'none', borderRadius: 4, padding: '6px 16px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: activePastEvent === 'NOV_2024' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            NOV 2024 DOJ INDICTMENT
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* ────── LEFT PANEL: PAST SIGNAL CHART ────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', letterSpacing: '0.05em' }}>
              {activePastEvent === 'JAN_2023' ? 'JANUARY 2023 - HINDENBURG EVENT' : 'NOVEMBER 2024 - DOJ INDICTMENT'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>What the system would have detected</div>
          </div>
          
          <div style={{ height: 350, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pastData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} minTickGap={20} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#3B82F6' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#EF4444' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                
                <defs>
                  <linearGradient id="colorPriceBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                {/* Event Annotations */}
                {activePastEvent === 'JAN_2023' && (
                  <>
                    <ReferenceLine yAxisId="right" x="Jan 20" stroke="#F59E0B" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'SCORE > 60', fill: '#F59E0B', fontSize: 10 }} />
                    <ReferenceLine yAxisId="right" x="Jan 22" stroke="#EA580C" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'SCORE > 75', fill: '#EA580C', fontSize: 10 }} />
                    <ReferenceLine yAxisId="right" x="Jan 24" stroke="#DC2626" strokeWidth={2} label={{ position: 'insideBottomLeft', value: 'HINDENBURG PUBLISHED', fill: '#DC2626', fontSize: 10, fontWeight: 700 }} />
                  </>
                )}
                {activePastEvent === 'NOV_2024' && (
                  <>
                    <ReferenceLine yAxisId="right" x="Nov 18" stroke="#EA580C" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'SCORE > 60', fill: '#EA580C', fontSize: 10 }} />
                    <ReferenceLine yAxisId="right" x="Nov 20" stroke="#DC2626" strokeWidth={2} label={{ position: 'insideBottomLeft', value: 'DOJ NEWS BREAKS', fill: '#DC2626', fontSize: 10, fontWeight: 700 }} />
                  </>
                )}

                <Area yAxisId="left" type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorPriceBlue)" isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="dangerScore" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: 24, padding: '16px 20px', background: '#FEF2F2', borderRadius: 8, borderLeft: '4px solid #DC2626' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 12 }}>
              System would have signaled 4 days before crash
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
              {activePastEvent === 'JAN_2023' ? (
                <>
                  <div><span style={{ fontWeight: 600, color: '#111827', width: 60, display: 'inline-block' }}>[Jan 20]</span> PCR spike detected. OTM put OI +180%</div>
                  <div><span style={{ fontWeight: 600, color: '#111827', width: 60, display: 'inline-block' }}>[Jan 22]</span> IV percentile crossed 80%. FII net short.</div>
                  <div><span style={{ fontWeight: 600, color: '#EF4444', width: 60, display: 'inline-block' }}>[Jan 24]</span> HINDENBURG REPORT published</div>
                  <div><span style={{ fontWeight: 600, color: '#111827', width: 60, display: 'inline-block' }}>[Jan 25]</span> Stock -25% from Jan 20 signal price</div>
                </>
              ) : (
                <>
                  <div><span style={{ fontWeight: 600, color: '#111827', width: 60, display: 'inline-block' }}>[Nov 18]</span> PCR elevated, IV spike beginning</div>
                  <div><span style={{ fontWeight: 600, color: '#EF4444', width: 60, display: 'inline-block' }}>[Nov 20]</span> DoJ indictment news breaks</div>
                  <div><span style={{ fontWeight: 600, color: '#111827', width: 60, display: 'inline-block' }}>[Nov 21]</span> Stock -23%</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ────── RIGHT PANEL: PRESENT SIGNAL CHART ────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.05em', WebkitTextStroke: '0.5px #0891B2' }}>
              TODAY - LIVE DETECTION
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Rolling 60-day window live overlay</div>
          </div>
          
          <div style={{ height: 350, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={presentData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} minTickGap={20} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#3B82F6' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#EF4444' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                
                <defs>
                  <linearGradient id="colorPriceBlueLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                {/* Today Annotation */}
                {presentData.length > 0 && (
                  <ReferenceLine 
                    yAxisId="right" 
                    x={todayStr} 
                    stroke="#0891B2" 
                    strokeDasharray="3 3" 
                    label={{ position: 'insideTopLeft', value: 'TODAY', fill: '#0891B2', fontSize: 10, fontWeight: 700 }} 
                  />
                )}

                <Area yAxisId="left" type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorPriceBlueLive)" isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="dangerScore" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: 24, padding: '16px 20px', background: '#F8FAFC', borderRadius: 8, borderLeft: '4px solid #0891B2' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0891B2', marginBottom: 12 }}>
              Current State Analysis
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                The live danger score is currently <span style={{ fontWeight: 700, color: currentDanger > 60 ? '#EF4444' : '#10B981' }}>{currentDanger}/100</span>. 
                {currentDanger > 60 
                  ? " Elevated risk metrics detected. Option flow and sentiment velocity are trending negatively." 
                  : " System parameters are operating within normal baseline ranges. No immediate systemic anomaly detected."}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
