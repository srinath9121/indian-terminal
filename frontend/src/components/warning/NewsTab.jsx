import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  LineChart, Line
} from 'recharts';

const fetchNewsData = async (symbol) => {
  try {
    const resp = await fetch(`/warning/api/sentiment-velocity/${symbol}`);
    if (!resp.ok) throw new Error('API error');
    const d = await resp.json();
    const now = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const velocityData = [{ date: now, count: (d.recent_headlines || []).length }];
    const sentimentData = [{ date: now, sentiment: d.now_avg_sentiment || 0 }];
    const headlines = (d.recent_headlines || []).map((h, i) => ({
      id: i, badge: h.sentiment || 'NEUTRAL',
      headline: h.headline, source: h.source || 'RSS',
      time: h.time || 'Recent', score: h.sentiment_score || 0,
    }));
    return { velocityData, sentimentData, headlines, baseline: 5,
      velocity: d.velocity || 0, rateSpike: d.headline_rate_spike || 1, signal: d.signal || 'STABLE',
      sentScore: d.sentiment_velocity_score || 0 };
  } catch (e) {
    return { velocityData: [], sentimentData: [], headlines: [], baseline: 5,
      velocity: 0, rateSpike: 1, signal: 'OFFLINE', sentScore: 0 };
  }
};

const VelocityTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#111827', padding: '8px 12px', borderRadius: 4, color: '#FFF', fontSize: 12, border: '1px solid #1F2937' }}>
        <div style={{ color: '#9CA3AF' }}>{label}</div>
        <div>Articles: {payload[0].value}</div>
      </div>
    );
  }
  return null;
};

const SentimentTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const color = val > 0 ? '#10B981' : '#EF4444';
    return (
      <div style={{ background: '#111827', padding: '8px 12px', borderRadius: 4, color: '#FFF', fontSize: 12, border: '1px solid #1F2937' }}>
        <div style={{ color: '#9CA3AF' }}>{label}</div>
        <div>FinBERT Score: <span style={{ color }}>{val}</span></div>
      </div>
    );
  }
  return null;
};

export default function NewsTab({ symbol }) {
  const [data, setData] = useState(null);

  useEffect(() => { fetchNewsData(symbol).then(setData); }, [symbol]);

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>Initializing Sentiment Engine...</div>;

  const isElevated = data.rateSpike > 2;
  const signalColor = data.signal === 'CRITICAL' ? '#EF4444' : data.signal === 'RAPID_DECLINE' ? '#F59E0B' : data.signal === 'DETERIORATING' ? '#F97316' : '#10B981';

  const getBadgeStyle = (badge) => {
    if (badge === 'BEARISH') return { bg: '#450a0a', color: '#EF4444', border: '#7f1d1d' };
    if (badge === 'BULLISH') return { bg: '#064e3b', color: '#10B981', border: '#065f46' };
    return { bg: '#1F2937', color: '#9CA3AF', border: '#374151' };
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: '#EF4444', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>◎</span> SENTIMENT VELOCITY ENGINE
      </h2>

      {/* ── VELOCITY METRICS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'VELOCITY', value: data.velocity.toFixed(3), color: data.velocity < -0.2 ? '#EF4444' : '#10B981' },
          { label: 'RATE SPIKE', value: `${data.rateSpike.toFixed(1)}x`, color: data.rateSpike > 3 ? '#EF4444' : '#9CA3AF' },
          { label: 'SCORE', value: `${data.sentScore}/100`, color: data.sentScore > 50 ? '#EF4444' : '#10B981' },
          { label: 'SIGNAL', value: data.signal, color: signalColor },
        ].map((m, i) => (
          <div key={i} style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6B7280', letterSpacing: '0.08em', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Velocity Chart */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#9CA3AF', letterSpacing: '0.05em' }}>NEWS VELOCITY (7 DAYS)</div>
            {isElevated && (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: '#EF4444', background: '#450a0a', padding: '4px 10px', borderRadius: 4, border: '1px solid #7f1d1d', boxShadow: '0 0 8px rgba(239,68,68,0.3)' }}>
                ELEVATED VELOCITY
              </div>
            )}
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<VelocityTooltip />} cursor={{ fill: '#111827' }} />
                <ReferenceLine y={data.baseline} stroke="#6B7280" strokeDasharray="3 3" label={{ position: 'top', value: 'AVG', fill: '#6B7280', fontSize: 10 }} />
                <Bar dataKey="count" isAnimationActive={false} radius={[3, 3, 0, 0]}>
                  {data.velocityData.map((entry, index) => {
                    const ratio = entry.count / data.baseline;
                    const fill = ratio > 2 ? '#EF4444' : ratio > 1.5 ? '#F59E0B' : '#3B82F6';
                    return <Cell key={index} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Trend */}
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: 16 }}>
            SENTIMENT TREND (FINBERT)
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sentimentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }} tickLine={false} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<SentimentTooltip />} />
                <ReferenceLine y={0} stroke="#374151" />
                <defs>
                  <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="sentiment" stroke="url(#sentGrad)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#0D0D1A' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── HEADLINES FEED ── */}
      <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#9CA3AF', letterSpacing: '0.05em' }}>FINBERT-SCORED HEADLINES</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6B7280' }}>{data.headlines.length} processed</div>
        </div>
        <div>
          {data.headlines.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#6B7280', fontStyle: 'italic' }}>No headlines detected for this symbol. RSS feeds may be empty.</div>
          )}
          {data.headlines.map((item, i) => {
            const style = getBadgeStyle(item.badge);
            const scoreColor = item.score > 0.2 ? '#10B981' : item.score < -0.2 ? '#EF4444' : '#9CA3AF';
            return (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', gap: 16, 
                padding: '14px 20px', borderBottom: i === data.headlines.length - 1 ? 'none' : '1px solid #111827',
                background: i % 2 === 0 ? 'transparent' : 'rgba(17,24,39,0.5)',
                transition: 'background 0.2s'
              }}>
                <div style={{ width: 90 }}>
                  <span style={{ 
                    fontSize: 10, fontWeight: 700, background: style.bg, color: style.color, 
                    padding: '3px 8px', borderRadius: 4, fontFamily: "'Space Mono', monospace",
                    border: `1px solid ${style.border}`
                  }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{item.headline}</div>
                </div>
                <div style={{ width: 60, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: scoreColor }}>{item.score.toFixed(2)}</div>
                  <div style={{ fontSize: 8, color: '#6B7280' }}>SCORE</div>
                </div>
                <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: '#6B7280', textAlign: 'right' }}>{item.source}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
