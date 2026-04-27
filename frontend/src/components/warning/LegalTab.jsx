import { useState, useEffect } from 'react';

// Danger words for Phase 6 NLP Highlighting
const DANGER_WORDS = ['subpoena', 'investigation', 'fraud', 'indictment', 'bribery', 'violation', 'penalty', 'default', 'seized', 'money laundering', 'irregularities'];

// Helper to highlight danger words
const highlightDangerWords = (text) => {
  if (!text) return text;
  let highlightedText = text;
  DANGER_WORDS.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlightedText = highlightedText.replace(regex, '|||$1|||');
  });

  return highlightedText.split('|||').map((part, i) => {
    const isDanger = DANGER_WORDS.includes(part.toLowerCase());
    if (isDanger) {
      return (
        <span key={i} style={{ 
          color: '#EF4444', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.2)', 
          padding: '2px 4px', borderRadius: '4px', border: '1px solid #7f1d1d' 
        }}>
          {part.toUpperCase()}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const fetchLegalData = async (symbol) => {
  try {
    const resp = await fetch(`/warning/api/legal/${symbol}`);
    if (!resp.ok) throw new Error('API error');
    const d = await resp.json();
    const filings = d.filings || [];
    const usLegal = filings.filter(f => f.source === 'CourtListener').map(f => ({ ...f, isNew: f.days_ago < 30 }));
    const sebi = filings.filter(f => f.source === 'SEBI').map(f => ({ ...f, isNew: f.days_ago < 30 }));
    const pib = filings.filter(f => f.source === 'PIB').map(f => ({ ...f, type: 'Notice', isNew: true }));
    return { usLegal, sebi, pib, supremeCourt: [], legalScore: d.legal_score || {} };
  } catch (e) {
    console.warn('LegalTab fetch error:', e);
    return { usLegal: [], sebi: [], pib: [], supremeCourt: [], legalScore: {} };
  }
};

const LegalSection = ({ title, data, type }) => {
  const hasData = data && data.length > 0;
  const hasNew = hasData && data.some(d => d.isNew);

  return (
    <div style={{ background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', borderBottom: '1px solid #1F2937', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: '#F9FAFB', letterSpacing: '0.05em' }}>
          {title}
        </div>
        {hasNew ? (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#450a0a', padding: '4px 10px', borderRadius: 4, border: '1px solid #7f1d1d' }}>
            FILING DETECTED
          </div>
        ) : (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: '#10B981', background: '#064e3b', padding: '4px 10px', borderRadius: 4, border: '1px solid #065f46' }}>
            MONITORING ACTIVE
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {!hasData ? (
          <div style={{ background: '#064e3b', border: '1px solid #059669', padding: 16, borderRadius: 6, color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>
            CLEAR - No active proceedings found in this jurisdiction.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #1F2937' }}>
                <th style={{ textAlign: 'left', padding: '0 0 8px 0', color: '#9CA3AF', fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>Date</th>
                <th style={{ textAlign: 'left', padding: '0 0 8px 0', color: '#9CA3AF', fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>Court / Agency</th>
                <th style={{ textAlign: 'left', padding: '0 0 8px 0', color: '#9CA3AF', fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>Case Title</th>
                <th style={{ textAlign: 'left', padding: '0 0 8px 0', color: '#9CA3AF', fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>Docket / Type</th>
                <th style={{ textAlign: 'left', padding: '0 0 8px 0', color: '#9CA3AF', fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const rowBg = row.isNew ? 'rgba(239, 68, 68, 0.05)' : 'transparent';
                const dateColor = row.isNew ? '#EF4444' : '#9CA3AF';
                
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1F2937', background: rowBg }}>
                    <td style={{ padding: '12px 8px', color: dateColor, fontWeight: row.isNew ? 700 : 400, fontFamily: "'Space Mono', monospace" }}>
                      {row.date}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#D1D5DB' }}>{row.court}</td>
                    <td style={{ padding: '12px 8px', color: '#F9FAFB' }}>
                      {highlightDangerWords(row.title)}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#9CA3AF' }}>{row.type || row.status}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <a href={row.link || row.url} style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }} target="_blank" rel="noreferrer">View →</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default function LegalTab({ symbol }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchLegalData(symbol).then(setData);
  }, [symbol]);

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>Initializing Legal Radar...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24, fontSize: 18, fontWeight: 700, color: '#EF4444', fontFamily: "'Space Mono', monospace", display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>◎</span> AUTOMATED LEGAL & REGULATORY RADAR
      </div>
      
      <LegalSection title="US DEPARTMENT OF JUSTICE / SEC" data={data.usLegal} type="us" />
      <LegalSection title="SEBI ENFORCEMENT" data={data.sebi} type="sebi" />
      <LegalSection title="PIB GOVERNMENT NOTICES" data={data.pib} type="pib" />
      <LegalSection title="SUPREME COURT OF INDIA" data={data.supremeCourt} type="sci" />

      <div style={{ marginTop: 32, padding: 20, background: '#110000', border: '1px solid #550000', borderRadius: 8, fontSize: 11, color: '#FCA5A5', fontStyle: 'italic', lineHeight: 1.5 }}>
        <strong>DISCLAIMER:</strong> Legal monitoring is automated by parsing CourtListener, SEBI, and PIB APIs. 
        It may experience delays or miss filings entirely. Always verify legal statuses directly with 
        CourtListener.com and SEBI.gov.in. Not legal advice.
      </div>
    </div>
  );
}
