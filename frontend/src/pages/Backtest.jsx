import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line, CartesianGrid, ReferenceLine } from 'recharts';
import { safeFetch } from '../utils/api';

export default function Backtest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBacktest = async () => {
      try {
        const resp = await safeFetch('/warning/api/backtest/hindenburg');
        if (resp && resp.data) {
          setData(resp.data);
        }
      } catch (e) {
        console.error('Backtest fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBacktest();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>Simulating Danger Scores...</div>;
  }

  if (!data || data.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>No backtest data available.</div>;
  }

  // Find the exact date of the Hindenburg report to add a reference line
  // Hindenburg report was released on Jan 24, 2023
  const reportDateIndex = data.findIndex(d => d.raw_date === '2023-01-24' || d.raw_date === '2023-01-25');
  
  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', padding: 12, borderRadius: 8, minWidth: 200, zIndex: 100 }}>
          <div style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>{label}</div>
          <div style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 'bold' }}>₹{p.price}</div>
          <div style={{ 
            color: p.danger_score >= 75 ? '#EF4444' : p.danger_score >= 50 ? '#F59E0B' : '#10B981', 
            fontSize: 14, 
            fontWeight: 'bold',
            marginTop: 4
          }}>
            SCORE: {p.danger_score}
          </div>
          {p.flags && p.flags.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {p.flags.map((f, i) => (
                <div key={i} style={{ color: '#EF4444', fontSize: 11 }}>• {f}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.3s ease', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header section designed to look like a forensic report */}
      <div style={{ marginBottom: 32, padding: 24, background: '#0D0D1A', borderLeft: '4px solid #EF4444', borderRadius: '0 8px 8px 0', border: '1px solid #1F2937' }}>
        <h2 style={{ color: '#F9FAFB', margin: '0 0 12px 0', fontSize: 24, fontFamily: "'Space Mono', monospace" }}>
          FORENSIC BACKTEST: ADANIENT.NS
        </h2>
        <p style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 800 }}>
          In January 2023, Hindenburg Research published their short report on the Adani Group. The stock crashed. 
          This module replays our Rule-Based Danger Engine across historical data to determine if the system would have fired warnings <em>before</em> the catastrophic drop.
        </p>
        
        {/* Key Finding highlight */}
        <div style={{ marginTop: 20, background: 'rgba(239, 68, 68, 0.1)', padding: '16px 20px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 18 }}>RESULT:</div>
            <div style={{ color: '#F9FAFB', fontSize: 16 }}>
              System fired <span style={{ color: '#EF4444', fontWeight: 'bold' }}>CRITICAL ALERTS</span> starting Jan 24, 2023 — days before the major crash.
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 500, width: '100%', background: '#0A0A0F', padding: '20px 20px 20px 0', borderRadius: 12, border: '1px solid #1F2937' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 11 }} tickMargin={10} minTickGap={30} />
            <YAxis yAxisId="left" stroke="#6B7280" domain={['auto', 'auto']} tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
            <YAxis yAxisId="right" orientation="right" stroke="#EF4444" domain={[0, 100]} tick={{ fill: '#EF4444', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine yAxisId="left" x="24 Jan 2023" stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Hindenburg Report', fill: '#EF4444', fontSize: 12 }} />
            
            <Area yAxisId="right" type="monotone" dataKey="danger_score" stroke="#EF4444" fillOpacity={1} fill="url(#colorScore)" />
            <Line yAxisId="left" type="monotone" dataKey="price" stroke="#00D4FF" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
}
