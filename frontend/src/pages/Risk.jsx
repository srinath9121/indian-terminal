import React, { useState, useEffect } from 'react';

export default function Risk() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/india-risk-score')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error);
  }, []);

  if (!data) return <div style={{ color: '#8892A0', padding: 20, fontFamily: 'var(--font-mono)' }}>Loading Risk Model...</div>;

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: '#0D0D1A', border: '1px solid #1A1A2E', borderRadius: 8, padding: 30, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: '#FFF', marginBottom: 16 }}>ADVANCED RISK DASHBOARD</h2>
        <div style={{ fontSize: 48, fontFamily: 'var(--font-mono)', color: data.irs >= 70 ? '#FF4444' : '#00FF88', fontWeight: 'bold' }}>
          {data.irs} / 100
        </div>
        <p style={{ fontFamily: 'var(--font-body)', color: '#8892A0', marginTop: 12 }}>
          {data.mode} | Zone: {data.zone}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', color: '#555B66', marginTop: 20, fontSize: 13 }}>
          See PULSE page for the comprehensive widget breakdown.
        </p>
      </div>
    </div>
  );
}
