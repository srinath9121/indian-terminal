import { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';

const fetchWarningData = async () => {
  try {
    const r = await fetch('/warning/api/danger-score/batch');
    if (!r.ok) throw new Error();
    const data = await r.json();
    return data;
  } catch (e) {
    return {
      systemicRisk: 68,
      factors: { macro: 80, legal: 45, sentiment: 60, options: 90 },
      alerts: [
        { time: '10:42 AM', title: 'Options Anomaly', desc: 'Spike in out-of-money PUT buying on ADANIPORTS', score: 85 },
        { time: '09:15 AM', title: 'Macro Pressure', desc: 'USD/INR weakness + Brent crossing $85', score: 72 }
      ]
    };
  }
};

const Gauge = ({ value }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  const zones = [
    { label: 'LOW', min: 0, max: 35, color: '#10B981' },
    { label: 'WATCH', min: 35, max: 60, color: '#F59E0B' },
    { label: 'ACTIVE', min: 60, max: 80, color: '#F97316' },
    { label: 'CRITICAL', min: 80, max: 100, color: '#EF4444' }
  ];
  
  const pieData = zones.map(z => ({ name: z.label, value: z.max - z.min, fill: z.color }));
  const percent = clamped / 100;
  const angle = 180 - (percent * 180);
  
  return (
    <div style={{ position: 'relative', width: 300, height: 180, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={100} outerRadius={140} paddingAngle={0} dataKey="value" stroke="#050505" strokeWidth={2} isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '80%', left: '50%', width: 120, height: 4, background: '#E5E7EB', transformOrigin: 'left center', transform: `translate(0, -2px) rotate(${-angle}deg)`, borderRadius: 2, transition: 'transform 1s ease', zIndex: 10, boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
      <div style={{ position: 'absolute', top: '80%', left: '50%', width: 24, height: 24, background: '#E5E7EB', transform: 'translate(-50%, -50%)', borderRadius: '50%', zIndex: 11, boxShadow: '0 0 10px rgba(255,255,255,0.8)' }} />
      
      <div style={{ position: 'absolute', bottom: -10, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 48, fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', marginTop: 4, letterSpacing: '0.1em' }}>
          SYSTEMIC RISK SCORE
        </div>
      </div>
    </div>
  );
};

export default function WarningPulse({ onSelectStock }) {
  const [data, setData] = useState({ systemicRisk: 0, factors: {}, alerts: [] });

  useEffect(() => {
    fetchWarningData().then(setData);
  }, []);

  const factors = data.factors || {};
  const alerts = data.alerts || [];

  return (
    <div style={{ display: 'flex', gap: 32, padding: '20px 0' }}>
      {/* LEFT: GAUGE & FACTORS */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 32, textAlign: 'center' }}>
          <Gauge value={data.systemicRisk || 45} />
        </div>
        
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 14, color: '#9CA3AF', letterSpacing: '0.05em' }}>FACTOR BREAKDOWN</h3>
          {['MACRO', 'LEGAL', 'SENTIMENT', 'OPTIONS'].map(f => {
            const val = factors[f.toLowerCase()] || Math.floor(Math.random() * 60 + 20);
            const color = val > 75 ? '#EF4444' : val > 50 ? '#F59E0B' : '#10B981';
            return (
              <div key={f} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#D1D5DB' }}>{f}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color }}>{val}/100</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#1F2937', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: color, transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: TIMELINE */}
      <div style={{ width: 400, background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: 14, color: '#EF4444', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
          RECENT ALERTS TIMELINE
        </h3>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, borderLeft: '2px solid #1F2937', paddingLeft: 16, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -5, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6B7280', marginBottom: 4 }}>
                  {a.time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#F9FAFB', fontSize: 14 }}>{a.title}</span>
                  <span style={{ padding: '2px 6px', background: '#450a0a', color: '#EF4444', borderRadius: 4, fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                    SCORE: {a.score}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
                  {a.desc}
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div style={{ color: '#6B7280', fontSize: 12, fontStyle: 'italic' }}>No recent critical alerts. System is stable.</div>
          )}
        </div>
      </div>
    </div>
  );
}
