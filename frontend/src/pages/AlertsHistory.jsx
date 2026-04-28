import React, { useState, useEffect } from 'react';
import { safeFetch } from '../utils/api';

export default function AlertsHistory() {
  const [alerts, setAlerts] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const resp = await safeFetch('/warning/api/alerts/history');
        if (resp && resp.alerts) {
          setAlerts(resp.alerts);
        }
      } catch (e) {
        console.error('Failed to fetch alerts history:', e);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchLiveAlerts = async () => {
      try {
        const resp = await safeFetch('/warning/api/alerts/live');
        if (resp && resp.alerts) {
          setLiveAlerts(resp.alerts);
        }
      } catch (e) {
        console.error('Failed to fetch live alerts:', e);
      }
    };

    fetchAlerts();
    fetchLiveAlerts();
    
    // Poll live alerts every 60s
    const id = setInterval(fetchLiveAlerts, 60000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>Loading Alert History...</div>;
  }

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.3s ease', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* ── LIVE ACTIVITY FEED (New) ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444', animation: 'pulse 2s infinite' }} />
          <h2 style={{ color: '#F9FAFB', margin: 0, fontSize: 18, fontFamily: "'Space Mono', monospace" }}>
            LIVE ADANI ACTIVITY FEED
          </h2>
          <span style={{ color: '#6B7280', fontSize: 10 }}>UPDATES EVERY MINUTE</span>
        </div>
        
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, maxHeight: 250, overflowY: 'auto', padding: 4 }}>
          {liveAlerts.length === 0 ? (
            <div style={{ padding: 20, color: '#4B5563', fontSize: 12, fontFamily: "'Space Mono', monospace", textAlign: 'center' }}>
              Monitoring Adani volatility...
            </div>
          ) : (
            liveAlerts.map((la, i) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', 
                borderBottom: i === liveAlerts.length - 1 ? 'none' : '1px solid #1F2937',
                fontFamily: "'Space Mono', monospace", fontSize: 12,
                animation: 'slideInRight 0.3s ease'
              }}>
                <span style={{ color: '#6B7280' }}>[{la.time}]</span>
                <span style={{ color: '#00D4FF', fontWeight: 'bold', minWidth: 100 }}>{la.stock}</span>
                <span style={{ color: '#D1D5DB', flex: 1 }}>{la.event}</span>
                <span style={{ 
                  color: la.severity === 'HIGH' ? '#EF4444' : la.severity === 'MEDIUM' ? '#F59E0B' : '#10B981',
                  fontSize: 10, fontWeight: 'bold'
                }}>[{la.severity}]</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#F9FAFB', margin: '0 0 8px 0', fontSize: 24, fontFamily: "'Space Mono', monospace" }}>
          HISTORICAL CRITICAL LOG
        </h2>
        <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>
          Archive of major structural alerts and forward returns.
        </p>
      </div>

      <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#111827', borderBottom: '1px solid #1F2937', fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Symbol</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Score / Layer</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Price at Alert</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Price 7d Later</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Action Taken</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontFamily: "'Space Mono', monospace" }}>
                  No historical alerts found.
                </td>
              </tr>
            )}
            {alerts.map((alert, i) => {
              const p7d = alert.price_7d_later;
              const isPending = p7d === 'Pending';
              const returnPct = !isPending && alert.price_at_alert ? ((p7d - alert.price_at_alert) / alert.price_at_alert * 100) : 0;
              const returnColor = returnPct < 0 ? '#10B981' : '#EF4444'; // For a short alert, drop is good (green)
              
              return (
                <tr key={i} style={{ borderBottom: i === alerts.length - 1 ? 'none' : '1px solid #1F2937', fontFamily: "'Space Mono', monospace", fontSize: 13, background: i % 2 === 0 ? 'transparent' : '#0F131A' }}>
                  <td style={{ padding: '16px 20px', color: '#D1D5DB' }}>{alert.date}</td>
                  <td style={{ padding: '16px 20px', color: '#F9FAFB', fontWeight: 'bold' }}>{alert.stock}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: '#EF4444', fontWeight: 'bold', marginBottom: 4 }}>{alert.score}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{alert.layer}</div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#D1D5DB' }}>₹{alert.price_at_alert.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td style={{ padding: '16px 20px' }}>
                    {isPending ? (
                      <span style={{ color: '#EAB308', fontSize: 12 }}>Pending</span>
                    ) : (
                      <div>
                        <div style={{ color: '#D1D5DB' }}>₹{p7d.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                        <div style={{ fontSize: 11, color: returnColor, marginTop: 4 }}>
                          {returnPct > 0 ? '+' : ''}{returnPct.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: 4, fontSize: 11 }}>
                      {alert.action}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
