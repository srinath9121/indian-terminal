import { useState, useEffect } from 'react';

const fetchOptionsChain = async (symbol) => {
  try {
    const res = await fetch(`/warning/api/options-chain/${symbol}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { spot: 0, strikes: [], symbol };
  }
};

const OptionsAnomalyWarning = ({ anomaly }) => {
  if (!anomaly) return null;
  return (
    <div style={{
      background: '#2A0808', border: '1px solid #EF4444', borderRadius: 8, padding: 16,
      marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 16,
      boxShadow: '0 0 16px rgba(239, 68, 68, 0.2)'
    }}>
      <div style={{ background: '#EF4444', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 8px #EF4444' }}>
        <span style={{ color: '#FFF', fontWeight: 700, fontSize: 14 }}>!</span>
      </div>
      <div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em', marginBottom: 4 }}>
          OPTIONS ANOMALY DETECTED
        </div>
        <div style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>
          {anomaly.message}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <div style={{ background: '#1A0505', padding: '4px 8px', borderRadius: 4, border: '1px solid #450a0a' }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>Strike:</span> <span style={{ fontFamily: "'Space Mono', monospace", color: '#EF4444', fontWeight: 700 }}>{anomaly.strike}</span>
          </div>
          <div style={{ background: '#1A0505', padding: '4px 8px', borderRadius: 4, border: '1px solid #450a0a' }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>Put OI:</span> <span style={{ fontFamily: "'Space Mono', monospace", color: '#F9FAFB', fontWeight: 700 }}>{anomaly.putOi.toLocaleString()}</span>
          </div>
          <div style={{ background: '#1A0505', padding: '4px 8px', borderRadius: 4, border: '1px solid #450a0a' }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>Call OI:</span> <span style={{ fontFamily: "'Space Mono', monospace", color: '#F9FAFB', fontWeight: 700 }}>{anomaly.callOi.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OptionsStrikeTable = ({ data }) => {
  const strikes = data.strikes || [];
  if (strikes.length === 0) return <div style={{ color: '#9CA3AF' }}>No options data available.</div>;

  const spot = data.spot;
  const maxOi = Math.max(...strikes.map(s => Math.max(s.put_oi, s.call_oi)));

  return (
    <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', background: '#111827', padding: '12px 16px', borderBottom: '1px solid #1F2937' }}>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>CALL OI</div>
        <div style={{ width: 100, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>STRIKE</div>
        <div style={{ flex: 1, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>PUT OI</div>
      </div>
      
      <div style={{ padding: '8px 0' }}>
        {strikes.map(s => {
          const callWidth = (s.call_oi / maxOi) * 100;
          const putWidth = (s.put_oi / maxOi) * 100;
          const isATM = Math.abs(s.strike - spot) <= 50;

          return (
            <div key={s.strike} style={{ display: 'flex', padding: '6px 16px', alignItems: 'center', background: isATM ? '#1A1A2E' : 'transparent', borderBottom: isATM ? '1px solid #3B82F6' : 'none' }}>
              {/* Call OI Bar (Left to Right from Center) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#D1D5DB' }}>{s.call_oi.toLocaleString()}</span>
                <div style={{ width: '60%', height: 6, background: '#1F2937', borderRadius: 3, display: 'flex', justifyContent: 'flex-end', overflow: 'hidden' }}>
                  <div style={{ width: `${callWidth}%`, height: '100%', background: '#10B981', borderRadius: '3px 0 0 3px' }} />
                </div>
              </div>
              
              {/* Strike Price */}
              <div style={{ width: 100, textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: isATM ? 700 : 400, color: isATM ? '#3B82F6' : '#F9FAFB' }}>
                {s.strike}
              </div>
              
              {/* Put OI Bar (Left to Right from Center) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '60%', height: 6, background: '#1F2937', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${putWidth}%`, height: '100%', background: '#EF4444', borderRadius: '0 3px 3px 0' }} />
                </div>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#D1D5DB' }}>{s.put_oi.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function OptionsTab({ symbol }) {
  const [data, setData] = useState(null);
  const [anomaly, setAnomaly] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    fetchOptionsChain(symbol).then(d => {
      setData(d);
      
      // Volatility Skew / Anomaly Logic
      const strikes = d.strikes || [];
      let foundAnomaly = null;
      strikes.forEach(s => {
        // Simple logic: if Put OI is > 3x Call OI and Put OI > 100k, flag it
        if (s.put_oi > s.call_oi * 3 && s.put_oi > 100000) {
          foundAnomaly = {
            strike: s.strike,
            putOi: s.put_oi,
            callOi: s.call_oi,
            message: `Massive put writing/buying detected at the ${s.strike} strike. The Put OI is ${(s.put_oi/s.call_oi).toFixed(1)}x higher than Call OI, suggesting extreme downside hedging or institutional positioning.`
          };
        }
      });
      setAnomaly(foundAnomaly);
    });
  }, [symbol]);

  if (!data) return <div style={{ color: '#9CA3AF' }}>Loading options chain...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: '#F9FAFB', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#EF4444' }}>◎</span> OPTIONS CHAIN ANALYSIS
      </h2>
      
      <OptionsAnomalyWarning anomaly={anomaly} />
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.05em' }}>SPOT PRICE</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>₹{data.spot}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.05em', textAlign: 'right' }}>EXPIRY</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: '#D1D5DB' }}>{data.expiry}</div>
        </div>
      </div>
      
      <OptionsStrikeTable data={data} />
    </div>
  );
}
