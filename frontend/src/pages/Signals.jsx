import React, { useState, useEffect } from 'react';

export default function Signals() {
  const [signals, setSignals] = useState(null);

  useEffect(() => {
    fetch('/api/signals')
      .then(r => r.json())
      .then(d => setSignals(d))
      .catch(console.error);
  }, []);

  if (!signals) return <div style={{ color: '#8892A0', padding: 20, fontFamily: 'var(--font-mono)' }}>Loading Signals...</div>;

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 8, padding: 30 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: '#FFF', marginBottom: 16 }}>INTELLIGENCE FEED & SIGNALS</h2>
        
        <div style={{ padding: 16, background: '#1A1A2E', borderRadius: 6, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#00D4FF', marginBottom: 8 }}>MACRO DIRECTION</div>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: signals?.SIGNAL?.level === 'HIGH' ? '#FF4444' : '#00FF88', fontWeight: 'bold' }}>
            {signals?.SIGNAL?.direction}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', color: '#8892A0', fontSize: 12, marginTop: 4 }}>
            System Confidence: {signals?.SIGNAL?.confidence}
          </div>
        </div>
      </div>
    </div>
  );
}
