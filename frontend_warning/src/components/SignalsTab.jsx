import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, AreaChart, Area, PieChart, Pie
} from 'recharts';

// ────── MOCK DATA GENERATION ──────
const generateMockData = () => {
  const pcrHistory = [];
  const oiHistory = [];
  
  let pcr = 0.8;
  let putOi = 1000000;
  let callOi = 1200000;

  let date = new Date();
  date.setDate(date.getDate() - 14);

  for (let i = 0; i < 14; i++) {
    const isAnomaly = i >= 11; // Last 3 days spike
    
    pcr = isAnomaly ? pcr + 0.4 : pcr + (Math.random() * 0.2 - 0.1);
    putOi = isAnomaly ? putOi + 500000 : putOi + (Math.random() * 200000 - 100000);
    callOi = callOi + (Math.random() * 150000 - 75000);
    
    const dStr = new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    
    pcrHistory.push({ date: dStr, pcr: pcr });
    oiHistory.push({ 
      date: dStr, 
      putOi: Math.floor(putOi), 
      callOi: Math.floor(callOi),
      delta: i > 0 ? Math.floor(putOi - oiHistory[i-1].putOi) : 0
    });
    
    date.setDate(date.getDate() + 1);
  }

  return { pcrHistory, oiHistory };
};

// ────── CUSTOM GAUGE COMPONENT ──────
const SemiCircleGauge = ({ value, min, max, zones, title, formatValue, marker }) => {
  // Normalize value to 0-100 range for needle angle
  const clampedValue = Math.min(Math.max(value, min), max);
  const percent = (clampedValue - min) / (max - min);
  const angle = 180 - (percent * 180);
  
  // Calculate marker angle
  const markerPercent = marker ? (marker - min) / (max - min) : 0;
  const markerAngle = 180 - (markerPercent * 180);

  // Convert zones to PieChart data
  const pieData = zones.map(z => ({
    name: z.label,
    value: z.max - z.min,
    fill: z.color
  }));

  const cx = '50%';
  const cy = '75%';

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '24px 20px', position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', letterSpacing: '0.05em', textAlign: 'center', marginBottom: 16 }}>
        {title}
      </div>
      
      <div style={{ height: 140, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx={cx}
              cy={cy}
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Needle */}
        <div style={{
          position: 'absolute',
          top: '75%', left: '50%',
          width: 80, height: 4,
          background: '#111827',
          transformOrigin: 'left center',
          transform: `translate(-2px, -2px) rotate(${-angle}deg)`,
          borderRadius: 2,
          transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10
        }} />
        <div style={{
          position: 'absolute',
          top: '75%', left: '50%',
          width: 16, height: 16,
          background: '#111827',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          zIndex: 11
        }} />

        {/* 30d Avg Marker */}
        {marker && (
          <div style={{
            position: 'absolute',
            top: '75%', left: '50%',
            width: 100, height: 2,
            background: 'transparent',
            transformOrigin: 'left center',
            transform: `rotate(${-markerAngle}deg)`,
            zIndex: 5
          }}>
            <div style={{ position: 'absolute', right: 0, top: -4, width: 4, height: 10, background: '#111827' }} />
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: '#111827' }}>
          {formatValue ? formatValue(value) : value}
        </div>
      </div>
    </div>
  );
};


export default function SignalsTab({ symbol }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(generateMockData());
  }, [symbol]);

  if (!data) return null;

  const currentPcr = data.pcrHistory[data.pcrHistory.length - 1].pcr;
  const currentIv = 82; // Mock IV
  const currentDanger = 85; // Mock Danger
  
  const putOiAvg = data.oiHistory.reduce((acc, curr) => acc + curr.putOi, 0) / data.oiHistory.length;
  const lastPutOi = data.oiHistory[data.oiHistory.length - 1].putOi;
  const isAnomaly = lastPutOi > putOiAvg * 1.4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      
      {/* ────── ROW 1: THREE GAUGES ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        
        {/* GAUGE 1: PCR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SemiCircleGauge 
            title="PCR (PUT/CALL RATIO)"
            value={currentPcr}
            min={0} max={3.0}
            marker={1.1} // 30d avg
            formatValue={(v) => `${v.toFixed(2)}x`}
            zones={[
              { min: 0, max: 0.7, color: '#3B82F6', label: 'CALL HEAVY' },
              { min: 0.7, max: 1.3, color: '#10B981', label: 'BALANCED' },
              { min: 1.3, max: 1.8, color: '#F59E0B', label: 'PUT HEAVY' },
              { min: 1.8, max: 3.0, color: '#EF4444', label: 'EXTREME' }
            ]}
          />
          {/* Sparkline below gauge */}
          <div style={{ height: 60, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4 }}>14D PCR HISTORY</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.pcrHistory}>
                <Area type="monotone" dataKey="pcr" stroke="#6B7280" fill="#F3F4F6" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GAUGE 2: IV PERCENTILE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SemiCircleGauge 
            title="IV PERCENTILE"
            value={currentIv}
            min={0} max={100}
            formatValue={(v) => `${v}%`}
            zones={[
              { min: 0, max: 30, color: '#10B981', label: 'LOW' },
              { min: 30, max: 70, color: '#F59E0B', label: 'NORMAL' },
              { min: 70, max: 85, color: '#EA580C', label: 'ELEVATED' },
              { min: 85, max: 100, color: '#EF4444', label: 'IV SPIKE' }
            ]}
          />
        </div>

        {/* GAUGE 3: DANGER SCORE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SemiCircleGauge 
            title="DANGER SCORE"
            value={currentDanger}
            min={0} max={100}
            zones={[
              { min: 0, max: 35, color: '#10B981', label: 'CLEAR' },
              { min: 35, max: 60, color: '#F59E0B', label: 'WATCH' },
              { min: 60, max: 80, color: '#EA580C', label: 'WARNING' },
              { min: 80, max: 100, color: '#EF4444', label: 'CRITICAL' }
            ]}
          />
        </div>
      </div>

      {/* ────── ROW 2: OTM PUT OI CHART ────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '0.05em' }}>
            OTM PUT OPEN INTEREST (Last 10 Sessions)
          </div>
          {isAnomaly && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4 }}>
              ⚠️ ANOMALY: &gt;40% ABOVE 30D AVG
            </div>
          )}
        </div>
        
        <div style={{ height: 240, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.oiHistory.slice(-10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/100000).toFixed(1)}L`} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ background: '#111827', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, fontFamily: "'Space Mono', monospace" }}
                formatter={(value) => [value.toLocaleString(), 'Put OI']}
              />
              <ReferenceLine y={putOiAvg} stroke="#6B7280" strokeDasharray="3 3" label={{ position: 'top', value: '30D AVG', fill: '#6B7280', fontSize: 10 }} />
              <Bar dataKey="putOi" isAnimationActive={false}>
                {data.oiHistory.slice(-10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.delta > 0 ? '#EF4444' : '#10B981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ────── ROW 3: CALL OI VS PUT OI COMPARISON ────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '0.05em', marginBottom: 16 }}>
          CALL OI VS PUT OI COMPARISON
        </div>
        
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.oiHistory.slice(-10)} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/100000).toFixed(1)}L`} />
              <Tooltip 
                contentStyle={{ background: '#111827', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, fontFamily: "'Space Mono', monospace" }}
                formatter={(value, name) => [value.toLocaleString(), name]}
              />
              <Area type="monotone" dataKey="putOi" name="Put OI" fill="#FEE2E2" stroke="none" fillOpacity={0.5} />
              <Line type="monotone" dataKey="putOi" name="Put OI" stroke="#EF4444" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="callOi" name="Call OI" stroke="#3B82F6" strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
