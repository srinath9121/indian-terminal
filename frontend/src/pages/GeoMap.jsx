import { useState, useEffect, useCallback, useMemo } from 'react';
import MainGlobe from '../components/MainGlobe';
import { safeFetch } from '../utils/api';

// ────── INDIA COORDINATES (always destination) ──────
const INDIA = { lat: 20.6, lng: 78.9 };

const getSeverityColor = (score) => {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#F97316';
  if (score >= 35) return '#3B82F6';
  return '#16A34A';
};

const getSeverityLabel = (score) => {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
};

// ────── FLOW ARC DEFINITIONS (from design doc P-3B) ──────
const ARCS = [
  { from: [32.4, 53.7],  name: 'Iran',     flow: 'Commodity',    color: '#EAB308', commodity: 'oil' },
  { from: [61.5, 105.3], name: 'Russia',   flow: 'Sanctions',    color: '#F97316', commodity: 'oil' },
  { from: [35.9, 104.2], name: 'China',    flow: 'Military',     color: '#EF4444', commodity: 'metals' },
  { from: [30.4, 69.3],  name: 'Pakistan', flow: 'Military',     color: '#EF4444', commodity: null },
  { from: [37.1, -95.7], name: 'USA',      flow: 'Diplomatic',   color: '#3B82F6', commodity: null },
  { from: [23.9, 45.1],  name: 'Saudi',    flow: 'Commodity',    color: '#EAB308', commodity: 'oil' },
  { from: [31.0, 35.0],  name: 'Israel',   flow: 'Military',     color: '#EF4444', commodity: null },
  { from: [55.4, 25.0],  name: 'Russia2',  flow: 'Agricultural', color: '#84CC16', commodity: 'agri' },
];

// ────── COUNTRY IMPACT TEXT (from design doc P-3C) ──────
const COUNTRY_IMPACT = {
  'Iran': {
    flag: '🇮🇷',
    text: 'Hormuz strait risk. India imports 12% crude via Iran. ONGC/BPCL/IOC directly impacted. Brent premium +$3-5.',
    events: [],
    signals: [
      { badge: 'SELL', asset: 'BPCL, IOC', reason: 'Crude import cost spike' },
      { badge: 'BUY', asset: 'Gold', reason: 'Safe-haven demand surge' },
    ],
  },
  'China': {
    flag: '🇨🇳',
    text: 'FII outflow risk. IT sector supply chain pressure. HDFC, ICICI, Nifty IT watch. India-China border tensions amplify capital outflows.',
    events: [],
    signals: [
      { badge: 'SELL', asset: 'Nifty IT', reason: 'Supply chain pressure' },
      { badge: 'WATCH', asset: 'HDFC, ICICI', reason: 'FII outflow risk' },
    ],
  },
  'Russia': {
    flag: '🇷🇺',
    text: 'Oil/fertilizer supply. GSFC, Chambal Fertilisers exposure. Rupee pressure from energy import bill.',
    events: [],
    signals: [
      { badge: 'WATCH', asset: 'GSFC, Chambal', reason: 'Fertilizer supply risk' },
      { badge: 'SELL', asset: 'INR', reason: 'Energy import bill pressure' },
    ],
  },
  'Pakistan': {
    flag: '🇵🇰',
    text: 'Border tension = defence sector bullish. HAL, BEL, Bharat Dynamics, MTAR Tech watch.',
    events: [],
    signals: [
      { badge: 'BUY', asset: 'HAL, BEL', reason: 'Defence sector tailwind' },
      { badge: 'BUY', asset: 'Bharat Dynamics', reason: 'Order pipeline boost' },
    ],
  },
  'USA': {
    flag: '🇺🇸',
    text: 'Fed rate sensitivity. Dollar strength = INR weakness. FII flows at risk. IT sector USD revenue benefit.',
    events: [],
    signals: [
      { badge: 'BUY', asset: 'Nifty IT', reason: 'USD revenue benefit' },
      { badge: 'WATCH', asset: 'USDINR', reason: 'Dollar strength risk' },
    ],
  },
  'Saudi': {
    flag: '🇸🇦',
    text: 'OPEC+ output decisions drive Brent. India net importer — oil spike = CAD widening = INR weak.',
    events: [],
    signals: [
      { badge: 'WATCH', asset: 'Brent', reason: 'OPEC+ decisions' },
      { badge: 'SELL', asset: 'INR', reason: 'CAD widening risk' },
    ],
  },
  'Israel': {
    flag: '🇮🇱',
    text: 'Middle East escalation. Oil route risk. Gold safe-haven demand. Sovereign gold bond interest rises.',
    events: [],
    signals: [
      { badge: 'BUY', asset: 'Gold', reason: 'Safe-haven surge' },
      { badge: 'WATCH', asset: 'Oil', reason: 'Route disruption risk' },
    ],
  },
};

// Map display names to arc country keys
const DISPLAY_TO_ARC_KEY = {
  'China': 'China', 'Pakistan': 'Pakistan', 'Iran': 'Iran',
  'Russia': 'Russia', 'Russian Federation': 'Russia',
  'United States of America': 'USA', 'United States': 'USA',
  'Saudi Arabia': 'Saudi', 'Israel': 'Israel',
};

// ────── PANEL STYLES ──────
const panelStyle = {
  background: 'rgba(0, 0, 0, 0.75)',
  border: '1px solid rgba(26,26,46,0.8)',
  borderRadius: 4,
  backdropFilter: 'blur(12px)',
};

export default function GeoMap({ commodityData }) {
  const [gdeltData, setGdeltData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCountryNews, setSelectedCountryNews] = useState([]);
  const [filterComm, setFilterComm] = useState('All');
  const [filterFlow, setFilterFlow] = useState('All');

  useEffect(() => {
    if (!selectedCountry) {
      setSelectedCountryNews([]);
      return;
    }
    const fetchNewsWithSentiment = async () => {
      try {
        const r = await fetch(`/api/geopolitical-news?country=${selectedCountry}`);
        if (!r.ok) return;
        const data = await r.json();
        const items = data.items || [];
        
        // Frontend FinBERT call per Phase 3 Prompt 3.2
        const scoredItems = await Promise.all(items.map(async (item) => {
          try {
            const sr = await fetch(`/api/sentiment?text=${encodeURIComponent(item.title)}`);
            if (sr.ok) {
              const sdata = await sr.json();
              return { ...item, sentiment: sdata };
            }
          } catch(e) {}
          return { ...item, sentiment: { label: 'neutral', score: 0.8, bias: 'neutral' } };
        }));
        setSelectedCountryNews(scoredItems);
      } catch(e) {}
    };
    fetchNewsWithSentiment();
  }, [selectedCountry]);

  // ── Fetch GDELT data, refresh every 15 min ──
  useEffect(() => {
    const fetchGdelt = async () => {
      const data = await safeFetch('/api/gdelt/india-events');
      if (data) setGdeltData(data);
    };
    fetchGdelt();
    const id = setInterval(fetchGdelt, 900000);
    return () => clearInterval(id);
  }, []);

  const handleCountryClick = useCallback((name) => {
    setSelectedCountry(name);
  }, []);

  // ── Resolve a country name to its GDELT tension score ──
  const getCountryGdeltScore = useCallback((countryKey) => {
    if (!gdeltData?.country_scores) return 50;
    const scores = gdeltData.country_scores;
    const lookupKeys = {
      Iran: ['IR', 'IRN'], Russia: ['RU', 'RUS'], China: ['CN', 'CHN'],
      Pakistan: ['PK', 'PAK'], USA: ['US', 'USA'], Saudi: ['SA', 'SAU'],
      Israel: ['IL', 'ISR'], Russia2: ['RU', 'RUS'],
    };
    const keys = lookupKeys[countryKey] || [];
    for (const k of keys) {
      if (scores[k] !== undefined) return scores[k];
    }
    return 50;
  }, [gdeltData]);

  // ── Build arc data per design doc ──
  const activeArcs = useMemo(() => {
    return ARCS
      .filter(arc => {
        const score = getCountryGdeltScore(arc.name);
        if (score < 35) return false;

        // Commodity filter
        if (filterComm !== 'All') {
          if (filterComm === 'Oil' && arc.commodity !== 'oil') return false;
          if (filterComm === 'Metals' && arc.commodity !== 'metals') return false;
          if (filterComm === 'Agriculture' && arc.commodity !== 'agri') return false;
          if (filterComm === 'Gold') return false; // Gold = no arcs, just highlight India
        }

        // Flow type filter
        if (filterFlow !== 'All' && arc.flow !== filterFlow) return false;

        return true;
      })
      .map(arc => {
        const score = getCountryGdeltScore(arc.name);
        const intensity = Math.min(1, score / 100);

        // Arc opacity driven by commodity pct_change
        let opacity = 0.7;
        if (commodityData && arc.commodity) {
          const comm = commodityData.find(c =>
            (arc.commodity === 'oil' && c.id === 'brent') ||
            (arc.commodity === 'metals' && c.id === 'copper')
          );
          if (comm) {
            opacity = Math.min(1.0, 0.4 + Math.abs(comm.pct_change || 0) / 5);
          }
        }

        return {
          startLat: arc.from[0],
          startLng: arc.from[1],
          endLat: INDIA.lat,
          endLng: INDIA.lng,
          color: `#${arc.color.slice(1)}`,
          dashLength: 0.4 + intensity * 0.3,
          dashGap: 0.15,
          speed: 2500 - intensity * 1500,
          altitude: 0.25 + intensity * 0.2,
          thickness: 1.2 + intensity * 2,
          label: `${arc.name} → India: ${arc.flow}`,
          opacity,
        };
      });
  }, [filterComm, filterFlow, getCountryGdeltScore, commodityData]);

  // ── Impact signals per design doc P-3C ──
  const impactSignals = useMemo(() => {
    const signals = [];
    const brent = commodityData?.find(c => c.id === 'brent');
    const copper = commodityData?.find(c => c.id === 'copper');
    const gold = commodityData?.find(c => c.id === 'gold');

    if (getCountryGdeltScore('Iran') >= 35 && brent) {
      signals.push({
        text: `Middle East tension + Brent ${brent.direction === 'up' ? '↑' : '↓'}`,
        bias: brent.direction === 'up' ? 'Bullish' : 'Bearish',
        color: '#EF4444',
      });
    }
    if (getCountryGdeltScore('China') >= 35 && copper) {
      signals.push({
        text: `China + Copper ${copper.direction === 'up' ? '↑' : '↓'}`,
        bias: copper.direction === 'up' ? 'Bullish' : 'Bearish',
        color: '#F97316',
      });
    }
    if (gold) {
      signals.push({
        text: `US Fed uncertainty + Gold ${gold.direction === 'up' ? '↑' : '↓'}`,
        bias: gold.direction === 'up' ? 'Bullish' : 'Bearish',
        color: '#3B82F6',
      });
    }
    return signals;
  }, [getCountryGdeltScore, commodityData]);

  // ── Selected country data ──
  const selectedImpact = useMemo(() => {
    if (!selectedCountry) return null;
    const key = DISPLAY_TO_ARC_KEY[selectedCountry] || selectedCountry;
    return COUNTRY_IMPACT[key] || COUNTRY_IMPACT[selectedCountry] || {
      flag: '🌍',
      text: 'Monitor for indirect macro spillover to FII flows, commodity prices, and INR stability.',
      events: [],
      signals: [{ badge: 'WATCH', asset: 'NIFTY', reason: 'Monitor indirect impact' }],
    };
  }, [selectedCountry]);

  const currentScore = useMemo(() => {
    if (!selectedCountry) return 35;
    const key = DISPLAY_TO_ARC_KEY[selectedCountry] || selectedCountry;
    return getCountryGdeltScore(key);
  }, [selectedCountry, getCountryGdeltScore]);

  const gtiValue = gdeltData?.gti || 0;
  const gtiColor = getSeverityColor(gtiValue);

  return (
    <div style={{ height: 'calc(100vh - 48px)', position: 'relative', background: '#000005', overflow: 'hidden' }}>

      {/* ────── GLOBE ────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <MainGlobe
          gtiValue={gtiValue}
          countryScores={gdeltData?.country_scores || {}}
          arcsData={activeArcs}
          onCountryClick={handleCountryClick}
        />
      </div>

      {/* ────── TOP LEFT: COMMODITY LINK FILTER ────── */}
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        ...panelStyle, borderLeft: '2px solid #00D4FF', padding: '10px 14px',
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#6B7280', marginBottom: 6, letterSpacing: '0.08em' }}>
          COMMODITY LINK
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {['All', 'Oil', 'Gold', 'Metals', 'Agriculture'].map(c => (
            <button key={c} onClick={() => setFilterComm(c)} style={{
              background: filterComm === c ? '#00D4FF' : '#374151',
              color: filterComm === c ? '#FFFFFF' : '#9CA3AF',
              border: 'none', padding: '3px 8px', borderRadius: 4,
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ────── TOP CENTER: GTI BADGE ────── */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        ...panelStyle, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: gtiColor }}>
          India GTI: {Math.round(gtiValue)}
        </span>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#00D4FF', boxShadow: '0 0 6px #00D4FF',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#00D4FF' }}>LIVE</span>
      </div>

      {/* ────── FLOW TYPE FILTER (below GTI badge) ────── */}
      <div style={{
        position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        ...panelStyle, padding: '6px 12px',
      }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {['All', 'Military', 'Sanctions', 'Commodity', 'Diplomatic'].map(f => (
            <button key={f} onClick={() => setFilterFlow(f)} style={{
              background: filterFlow === f ? '#00D4FF' : 'transparent',
              color: filterFlow === f ? '#FFFFFF' : '#6B7280',
              border: `1px solid ${filterFlow === f ? '#00D4FF' : '#374151'}`,
              padding: '2px 7px', borderRadius: 4,
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ────── TOP RIGHT: GLOBAL IMPACT SIGNALS ────── */}
      <div style={{
        position: 'absolute', top: 16, right: selectedCountry ? 400 : 16, zIndex: 10,
        transition: 'right 0.4s ease', maxWidth: 280,
        ...panelStyle, padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#D1D5DB', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            GLOBAL IMPACT SIGNALS
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {impactSignals.map((sig, i) => (
            <div key={i} style={{
              fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#9CA3AF',
              borderLeft: `2px solid ${sig.color}`, paddingLeft: 8, lineHeight: 1.4,
            }}>
              {sig.text}{' '}
              <span style={{
                color: sig.bias === 'Bullish' ? '#22C55E' : '#EF4444',
                fontWeight: 600,
              }}>
                ({sig.bias})
              </span>
            </div>
          ))}
          {impactSignals.length === 0 && (
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6B7280' }}>
              No active signals
            </div>
          )}
        </div>
      </div>

      {/* ────── BOTTOM LEFT: RISK LEGEND ────── */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 10,
        ...panelStyle, padding: '10px 14px',
      }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          COUNTRY RISK
        </div>
        {[
          { label: '≥80  CRITICAL', color: '#EF4444' },
          { label: '≥60  HIGH',     color: '#F97316' },
          { label: '≥35  MEDIUM',   color: '#3B82F6' },
          { label: '<35  LOW',      color: '#16A34A' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#D1D5DB' }}>{item.label}</span>
          </div>
        ))}

        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 10, marginBottom: 6 }}>
          FLOW TYPES
        </div>
        {[
          { label: 'Military',     color: '#EF4444' },
          { label: 'Sanctions',    color: '#F97316' },
          { label: 'Commodity',    color: '#EAB308' },
          { label: 'Diplomatic',   color: '#3B82F6' },
          { label: 'Agricultural', color: '#84CC16' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ width: 16, height: 2, background: item.color, borderRadius: 1 }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#D1D5DB' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ────── BOTTOM CENTER: CLICK PROMPT ────── */}
      {!selectedCountry && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          ...panelStyle, padding: '7px 20px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: '#00D4FF', fontSize: 14 }}>◎</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF' }}>
            Click any country to view India market impact
          </span>
        </div>
      )}

      {/* ────── RIGHT SIDE DRAWER: COUNTRY CLICK PANEL (380px) ────── */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 380,
        height: '100%',
        background: '#0D0D1A',
        borderLeft: '2px solid #00D4FF',
        transform: selectedCountry ? 'translateX(0)' : 'translateX(400px)',
        transition: 'transform 0.4s ease',
        zIndex: 20,
        padding: '20px 18px',
        overflowY: 'auto',
      }}>
        {selectedCountry && selectedImpact && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{selectedImpact.flag}</div>
                <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: '#F9FAFB', margin: 0 }}>
                  {selectedCountry}
                </h2>
                <div style={{
                  display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 4,
                  fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                  background: `${getSeverityColor(currentScore)}22`,
                  color: getSeverityColor(currentScore),
                }}>
                  {getSeverityLabel(currentScore)} · {Math.round(currentScore)}
                </div>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                style={{
                  background: 'transparent', border: '1px solid #374151', color: '#6B7280',
                  padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                }}
              >✕</button>
            </div>

            {/* Section 1: INDIA IMPACT ANALYSIS */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#00D4FF', letterSpacing: '0.08em', marginBottom: 8 }}>
                INDIA IMPACT ANALYSIS
              </div>
              <div style={{
                background: '#111827', padding: 12, borderRadius: 4, border: '1px solid #1A1A2E',
                borderLeft: `3px solid ${getSeverityColor(currentScore)}`,
                fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#D1D5DB', lineHeight: 1.6,
              }}>
                {selectedImpact.text}
              </div>
            </div>

            {/* Section 2: GDELT EVENTS + FinBERT (Phase 3) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#EAB308', letterSpacing: '0.08em', marginBottom: 8 }}>
                GDELT EVENTS (FINBERT SCORED)
              </div>
              {selectedCountryNews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedCountryNews.slice(0, 5).map((e, i) => {
                    const bias = e.sentiment?.bias || e.bias || 'neutral';
                    const biasColor = bias === 'bullish' ? '#22C55E' : bias === 'bearish' ? '#EF4444' : '#EAB308';
                    const badgeText = e.sentiment?.label ? e.sentiment.label.toUpperCase() : 'NEUTRAL';
                    
                    return (
                      <div key={i} style={{
                        padding: '10px 12px', background: '#111827', borderRadius: 4, borderLeft: `2px solid ${biasColor}`,
                        display: 'flex', flexDirection: 'column', gap: 6
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#6B7280' }}>
                            {e.date || e.timestamp || 'Recent'} | {e.source || e.domain || 'GlobalData'}
                          </div>
                          <div style={{
                            fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
                            padding: '2px 6px', borderRadius: 3, background: `${biasColor}20`, color: biasColor,
                            display: 'flex', alignItems: 'center', gap: 4
                          }}>
                            FinBERT: {badgeText} {(e.sentiment?.score * 100)?.toFixed(0) || 80}%
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#D1D5DB', lineHeight: 1.4 }}>
                          {e.title || e.headline || e.description || e}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6B7280', fontStyle: 'italic' }}>
                  Loading real-time events...
                </div>
              )}
            </div>

            {/* Section 3: INDIA SIGNALS */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#22C55E', letterSpacing: '0.08em', marginBottom: 8 }}>
                INDIA SIGNALS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedImpact.signals.map((s, i) => {
                  const badgeColor = s.badge === 'BUY' ? '#22C55E' : s.badge === 'SELL' ? '#EF4444' : '#EAB308';
                  const badgeBg = s.badge === 'BUY' ? '#14532D' : s.badge === 'SELL' ? '#7F1D1D' : '#713F12';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: '#111827', padding: '8px 10px', borderRadius: 4,
                    }}>
                      <span style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
                        color: badgeColor, background: badgeBg,
                        padding: '2px 6px', borderRadius: 3,
                      }}>
                        {s.badge}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#E5E7EB' }}>
                          {s.asset}
                        </div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#6B7280' }}>
                          {s.reason}
                        </div>
                      </div>
                      {/* Confidence bar (visual) */}
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: '#1A1A2E', overflow: 'hidden' }}>
                        <div style={{ width: '70%', height: '100%', background: badgeColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              fontSize: 9, fontFamily: "'Inter', sans-serif", color: '#4B5563', fontStyle: 'italic',
              borderTop: '1px solid #1A1A2E', paddingTop: 12,
            }}>
              For informational purposes only. Not financial advice. Do NOT show Entry/TP/SL prices.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
