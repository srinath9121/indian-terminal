import { useState, useEffect, useCallback, useMemo } from 'react';
import MainGlobe from '../components/MainGlobe';
import { safeFetch } from '../utils/api';

// ────── INDIA COORDINATES (always destination) ──────
const INDIA = { lat: 20.6, lng: 78.9 };

const getSeverityColor = (score) => {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#FF8C00';
  if (score >= 35) return '#3B82F6';
  return '#22C55E';
};

// ────── SOURCE COUNTRY COORDINATES ──────
const COUNTRY_COORDS = {
  Iran:    { lat: 32.4,  lng: 53.7  },
  Russia:  { lat: 61.5,  lng: 105.3 },
  China:   { lat: 35.9,  lng: 104.2 },
  Pakistan:{ lat: 30.4,  lng: 69.3  },
  USA:     { lat: 37.1,  lng: -95.7 },
  Saudi:   { lat: 23.9,  lng: 45.1  },
  Israel:  { lat: 31.0,  lng: 35.0  },
};

// ────── FLOW TYPE COLORS ──────
const FLOW_COLORS = {
  Military:   ['#EF4444', '#B91C1C'],
  Sanctions:  ['#F97316', '#C2410C'],
  Trade:      ['#EAB308', '#CA8A04'],
  Diplomatic: ['#3B82F6', '#1D4ED8'],
};

// ────── STATIC ARC DEFINITIONS (Source → India) ──────
// Each entry: source country, flow type, commodity category, label
const ARC_DEFINITIONS = [
  { country: 'Iran',     type: 'Trade',      commodity: 'Oil',         label: 'Iran → India: Oil via Hormuz' },
  { country: 'Russia',   type: 'Trade',      commodity: 'Oil',         label: 'Russia → India: Crude & Fertilizer' },
  { country: 'Russia',   type: 'Sanctions',  commodity: 'Oil',         label: 'Russia → India: Sanctions Bypass' },
  { country: 'China',    type: 'Military',   commodity: 'Metals',      label: 'China → India: LAC Tension' },
  { country: 'China',    type: 'Trade',      commodity: 'Metals',      label: 'China → India: Metal Trade' },
  { country: 'Pakistan', type: 'Military',   commodity: 'Oil',         label: 'Pakistan → India: Border Tension' },
  { country: 'USA',      type: 'Diplomatic', commodity: 'Metals',      label: 'USA → India: Tech & Defence Accord' },
  { country: 'USA',      type: 'Trade',      commodity: 'Oil',         label: 'USA → India: Trade Corridor' },
  { country: 'Saudi',    type: 'Trade',      commodity: 'Oil',         label: 'Saudi → India: Crude Supply' },
  { country: 'Israel',   type: 'Military',   commodity: 'Oil',         label: 'Israel → India: Regional Spillover' },
];

// ────── INDIA MARKET IMPACT (from Build Guide) ──────
const COUNTRY_IMPACT = {
  'China': {
    events: ['LAC military standoff', 'Tech supply chain pressure', 'Nifty IT likely to underperform'],
    commodities: [{ name: 'Copper', impact: 'Bearish' }, { name: 'Nifty IT', impact: 'Bearish' }],
    text: 'Trade tension risk. IT sector supply chain pressure. Nifty IT likely to underperform. FII risk-off.'
  },
  'Pakistan': {
    events: ['Regional security escalation', 'Defence PSU rally potential', 'INR pressure possible'],
    commodities: [{ name: 'HAL', impact: 'Bullish' }, { name: 'BEL', impact: 'Bullish' }, { name: 'Gold', impact: 'Bullish' }],
    text: 'Regional security escalation. Defence PSUs may rally. HAL, BEL, BHEL watch. INR pressure possible.'
  },
  'Iran': {
    events: ['Strait of Hormuz risk', 'India imports 85% crude via sea', 'Brent spike → RBI tightening risk'],
    commodities: [{ name: 'Brent', impact: 'Bullish' }, { name: 'ONGC', impact: 'Bearish' }, { name: 'BPCL', impact: 'Bearish' }],
    text: 'Strait of Hormuz risk. India imports 85% crude via sea. Brent spike → inflation → RBI tightening risk. ONGC, BPCL, IOC impact.'
  },
  'Russia': {
    events: ['Energy & fertilizer supply risk', 'Rupee depreciation pressure', 'GSFC, Chambal watch'],
    commodities: [{ name: 'Oil', impact: 'Bullish' }, { name: 'Fertilizer', impact: 'Bullish' }, { name: 'INR', impact: 'Bearish' }],
    text: 'Energy and fertilizer supply risk. Rupee depreciation pressure if oil disrupted. GSFC, Chambal watch.'
  },
  'United States of America': {
    events: ['Fed policy sensitivity', 'Dollar strength → FII outflows', 'IT sector USD revenue positive'],
    commodities: [{ name: 'Nifty IT', impact: 'Bullish' }, { name: 'Gold', impact: 'Bullish' }, { name: 'USDINR', impact: 'Bearish' }],
    text: 'Fed policy sensitivity. Dollar strength → FII outflows. IT sector USD revenue positive. Nifty IT divergence.'
  },
  'Saudi Arabia': {
    events: ['OPEC+ output decisions drive Brent', 'India net importer', 'Oil spike = CAD widening = INR weak'],
    commodities: [{ name: 'Brent', impact: 'Bullish' }, { name: 'INR', impact: 'Bearish' }],
    text: 'OPEC+ output decisions drive Brent. India net importer — oil spike = CAD widening = INR weak.'
  },
  'Israel': {
    events: ['Middle East escalation', 'Oil route risk', 'Gold safe-haven demand rises'],
    commodities: [{ name: 'Gold', impact: 'Bullish' }, { name: 'Oil', impact: 'Bullish' }],
    text: 'Middle East escalation. Oil route risk. Gold safe-haven demand. Sovereign gold bond interest rises.'
  },
};

// Map display names to arc country keys
const DISPLAY_TO_ARC_KEY = {
  'China': 'China', 'Pakistan': 'Pakistan', 'Iran': 'Iran',
  'Russia': 'Russia', 'Russian Federation': 'Russia',
  'United States of America': 'USA', 'United States': 'USA',
  'Saudi Arabia': 'Saudi', 'Israel': 'Israel',
};

export default function GeoMap({ commodityData }) {
  const [gdeltData, setGdeltData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [filterComm, setFilterComm] = useState('All');
  const [filterEvent, setFilterEvent] = useState('All');

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
      Israel: ['IL', 'ISR'],
    };
    const keys = lookupKeys[countryKey] || [];
    for (const k of keys) {
      if (scores[k] !== undefined) return scores[k];
    }
    return 50;
  }, [gdeltData]);

  // ── Build arc data: filter by commodity/type AND gate by GDELT score ≥ 35 ──
  const activeArcs = useMemo(() => {
    // 1. Base Arcs
    let definitions = [...ARC_DEFINITIONS];
    
    // 2. Add Agriculture Arc (new)
    if (getCountryGdeltScore('Russia') >= 35) {
      definitions.push({ 
        country: 'Russia', type: 'Trade', commodity: 'Agriculture', 
        label: 'Russia → India: Fertilizer Supply', colorOverride: '#84CC16' 
      });
    }

    return definitions
      .filter(arc => {
        const score = getCountryGdeltScore(arc.country);
        if (score < 35) return false;
        
        // Commodity Filter
        if (filterComm !== 'All' && arc.commodity !== filterComm) return false;
        
        // Flow Type Filter
        if (filterEvent !== 'All' && arc.type !== filterEvent) return false;
        
        return true;
      })
      .map(arc => {
        const src = COUNTRY_COORDS[arc.country];
        if (!src) return null;

        const score = getCountryGdeltScore(arc.country);
        const intensity = Math.min(1, score / 100);

        // Reactivity to Commodity Moves
        let signal_strength = 0.4 + intensity * 0.4;
        if (commodityData) {
          if (arc.commodity === 'Oil') {
            const brent = commodityData.find(c => c.id === 'brent');
            signal_strength = Math.min(1.0, 0.4 + Math.abs(brent?.pct_change || 0) / 10);
          } else if (arc.commodity === 'Metals') {
            const copper = commodityData.find(c => c.id === 'copper');
            signal_strength = Math.min(1.0, 0.4 + Math.abs(copper?.pct_change || 0) / 10);
          }
        }

        // Color based on source country's risk level (Red, Orange, Blue, Green)
        const arcColor = getSeverityColor(score);

        return {
          startLat: src.lat, startLng: src.lng, endLat: INDIA.lat, endLng: INDIA.lng,
          color: arc.colorOverride || arcColor,
          dashLength: 0.4 + intensity * 0.3,
          dashGap: 0.15,
          speed: 2500 - intensity * 1500,
          altitude: 0.25 + intensity * 0.2,
          thickness: 1.2 + intensity * 2,
          label: arc.label,
          opacity: signal_strength
        };
      })
      .filter(Boolean);
  }, [filterComm, filterEvent, getCountryGdeltScore, commodityData]);

  // ── Build GDELT-gated impact signals ──
  const impactSignals = useMemo(() => {
    const signals = [];
    const brent = commodityData?.find(c => c.id === 'brent');
    const copper = commodityData?.find(c => c.id === 'copper');
    const gold = commodityData?.find(c => c.id === 'gold');

    // Middle East / Oil Signal
    if (getCountryGdeltScore('Iran') >= 35 && brent) {
      signals.push({
        text: `Middle East tension → Oil ${brent.direction === 'up' ? '↑' : '↓'} (${brent.direction === 'up' ? 'Bullish for ONGC' : 'Bearish crude'})`,
        bias: brent.direction === 'up' ? 'Bullish' : 'Bearish',
        color: brent.direction === 'up' ? '#EF4444' : '#22C55E'
      });
    }

    // China / Metals Signal
    if (getCountryGdeltScore('China') >= 35 && copper) {
      signals.push({
        text: `China slowdown → Copper ${copper.direction === 'up' ? '↑' : '↓'}`,
        bias: copper.direction === 'up' ? 'Bullish' : 'Bearish',
        color: '#EAB308'
      });
    }

    // Gold / US Signal
    if (gold) {
      signals.push({
        text: `US Fed uncertainty → Gold ${gold.direction === 'up' ? '↑' : '↓'}`,
        bias: gold.direction === 'up' ? 'Bullish' : 'Bearish',
        color: '#3B82F6'
      });
    }

    return signals;
  }, [getCountryGdeltScore, commodityData]);

  // ── Side panel data ──
  const impactStats = useMemo(() => {
    if (!selectedCountry) return null;
    // Try direct match, then mapped key
    return COUNTRY_IMPACT[selectedCountry] || COUNTRY_IMPACT[DISPLAY_TO_ARC_KEY[selectedCountry]] || {
      events: ['Monitor for indirect macro spillover'],
      commodities: [{ name: 'NIFTY', impact: 'Neutral' }, { name: 'Gold', impact: 'Neutral' }],
      text: 'Monitor for indirect spillover to FII flows, commodity prices, and INR stability.'
    };
  }, [selectedCountry]);

  const currentScore = useMemo(() => {
    if (!selectedCountry || !gdeltData?.country_scores) return 35;
    const scores = gdeltData.country_scores;
    // Try to find score by country name or mapped code
    const key = DISPLAY_TO_ARC_KEY[selectedCountry];
    if (key) return getCountryGdeltScore(key);
    return scores[selectedCountry] || 35;
  }, [selectedCountry, gdeltData, getCountryGdeltScore]);

  return (
    <div style={{ height: 'calc(100vh - 48px)', position: 'relative', background: '#060611', overflow: 'hidden' }}>

      {/* ────── GLOBE ────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <MainGlobe
          gtiValue={gdeltData?.gti || 50}
          countryScores={gdeltData?.country_scores || {}}
          arcsData={activeArcs}
          onCountryClick={handleCountryClick}
        />
      </div>

      {/* ────── TOP LEFT: FILTER CONTROLS ────── */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Commodity Link Filter */}
        <div style={{
          background: 'rgba(8, 8, 18, 0.88)', padding: '10px 14px', borderRadius: 8,
          border: '1px solid rgba(26,26,46,0.8)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#6B7280', marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Commodity Link</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['All', 'Oil', 'Gold', 'Metals', 'Agriculture'].map(c => (
              <button key={c} onClick={() => setFilterComm(c)} style={{
                background: filterComm === c ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: filterComm === c ? '#93C5FD' : '#4B5563',
                border: `1px solid ${filterComm === c ? '#3B82F6' : '#1F2937'}`,
                padding: '3px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)',
                fontSize: 9, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Flow Type Filter */}
        <div style={{
          background: 'rgba(8, 8, 18, 0.88)', padding: '10px 14px', borderRadius: 8,
          border: '1px solid rgba(26,26,46,0.8)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#6B7280', marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Flow Type</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['All', 'Military', 'Sanctions', 'Trade', 'Diplomatic'].map(e => (
              <button key={e} onClick={() => setFilterEvent(e)} style={{
                background: filterEvent === e ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: filterEvent === e ? '#93C5FD' : '#4B5563',
                border: `1px solid ${filterEvent === e ? '#3B82F6' : '#1F2937'}`,
                padding: '3px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)',
                fontSize: 9, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ────── TOP RIGHT: GLOBAL IMPACT SIGNALS (GDELT-gated) ────── */}
      <div style={{
        position: 'absolute', top: 16, right: selectedCountry ? 336 : 16, zIndex: 10,
        transition: 'right 0.3s ease', maxWidth: 280,
      }}>
        <div style={{
          background: 'rgba(8, 8, 18, 0.92)', padding: '14px 16px', borderRadius: 8,
          border: '1px solid rgba(26,26,46,0.8)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#D1D5DB', letterSpacing: '0.12em' }}>GLOBAL IMPACT SIGNALS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {impactSignals.map((sig, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9CA3AF',
                borderLeft: `2px solid ${sig.color}`, paddingLeft: 8, lineHeight: 1.4,
              }}>
                {sig.text}{' '}
                <span style={{
                  color: sig.bias === 'Bullish' ? '#22C55E' : sig.bias === 'Bearish' ? '#EF4444' : '#6B7280',
                  fontWeight: 600,
                }}>
                  ({sig.bias})
                </span>
              </div>
            ))}
          </div>
          {gdeltData && (
            <div style={{ marginTop: 8, fontSize: 9, fontFamily: 'var(--font-mono)', color: '#4B5563' }}>
              GTI: {Math.round(gdeltData.gti || 0)}/100 · {activeArcs.length} active flows
            </div>
          )}
        </div>
      </div>

      {/* ────── BOTTOM LEFT: COUNTRY RISK LEGEND ────── */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 10,
        background: 'rgba(8, 8, 18, 0.88)', border: '1px solid rgba(26,26,46,0.8)',
        borderRadius: 8, padding: '10px 14px', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: '#6B7280', letterSpacing: '0.12em', marginBottom: 8 }}>COUNTRY RISK</div>
        {[
          { label: 'CRITICAL ≥80', color: '#EF4444' },
          { label: 'HIGH ≥60', color: '#F97316' },
          { label: 'MEDIUM ≥35', color: '#3B82F6' },
          { label: 'LOW <35', color: '#22C55E' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 12, height: 3, borderRadius: 2, background: item.color }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#D1D5DB' }}>{item.label}</span>
          </div>
        ))}

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: '#6B7280', letterSpacing: '0.12em', marginTop: 10, marginBottom: 8 }}>FLOW TYPES</div>
        {[
          { label: 'Military Tension', color: '#EF4444' },
          { label: 'Sanctions', color: '#F97316' },
          { label: 'Commodity Trade', color: '#EAB308' },
          { label: 'Diplomatic', color: '#3B82F6' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 12, height: 2, background: item.color, borderRadius: 1 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#D1D5DB' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ────── BOTTOM CENTER: CLICK PROMPT ────── */}
      {!selectedCountry && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          background: 'rgba(8, 8, 18, 0.85)', border: '1px solid #1F2937', borderRadius: 20,
          padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 10,
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: '#00D4FF', fontSize: 14 }}>◎</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF' }}>Click any country to view India market impact</span>
        </div>
      )}

      {/* ────── RIGHT SIDE PANEL (Country Click) ────── */}
      <div style={{
        position: 'absolute', top: 0, right: selectedCountry ? 0 : -330, width: 320,
        height: '100%', background: 'rgba(6, 6, 14, 0.96)', borderLeft: '1px solid #1F2937',
        backdropFilter: 'blur(16px)', transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20, padding: '20px 18px', overflowY: 'auto',
      }}>
        {selectedCountry && impactStats && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#F9FAFB', margin: 0 }}>{selectedCountry}</h2>
                <div style={{
                  display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 4,
                  fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  background: `${getSeverityColor(currentScore)}22`,
                  color: getSeverityColor(currentScore),
                  border: `1px solid ${getSeverityColor(currentScore)}44`,
                }}>
                  {currentScore >= 80 ? 'CRITICAL' : currentScore >= 60 ? 'HIGH' : currentScore >= 35 ? 'MEDIUM' : 'LOW'} · {Math.round(currentScore)}
                </div>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                style={{
                  background: 'transparent', border: '1px solid #374151', color: '#6B7280',
                  padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
                }}
              >✕</button>
            </div>

            {/* India Market Impact */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00D4FF', letterSpacing: '0.1em', marginBottom: 8 }}>INDIA MARKET IMPACT</div>
              <div style={{
                background: '#0F0F1A', padding: 12, borderRadius: 6, border: '1px solid #1F2937',
                borderLeft: `3px solid ${getSeverityColor(currentScore)}`,
                fontFamily: 'var(--font-mono)', fontSize: 11, color: '#D1D5DB', lineHeight: 1.6,
              }}>
                {impactStats.text}
              </div>
            </div>

            {/* Recent Events */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#EAB308', letterSpacing: '0.1em', marginBottom: 8 }}>RECENT EVENTS</div>
              <ul style={{ margin: 0, paddingLeft: 14, color: '#9CA3AF', fontFamily: 'var(--font-mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {impactStats.events.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>

            {/* India Signals */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22C55E', letterSpacing: '0.1em', marginBottom: 8 }}>INDIA SIGNALS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {impactStats.commodities.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#0F0F1A', padding: '8px 10px', borderRadius: 6, border: '1px solid #1F2937',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#E5E7EB' }}>{c.name}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                      color: c.impact === 'Bullish' ? '#22C55E' : c.impact === 'Bearish' ? '#EF4444' : '#EAB308',
                      background: c.impact === 'Bullish' ? 'rgba(34,197,94,0.1)' : c.impact === 'Bearish' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                      padding: '2px 6px', borderRadius: 3,
                    }}>
                      {c.impact === 'Bullish' ? 'BUY' : c.impact === 'Bearish' ? 'SELL' : 'WATCH'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              fontSize: 9, fontFamily: 'var(--font-mono)', color: '#4B5563', fontStyle: 'italic',
              borderTop: '1px solid #1F2937', paddingTop: 12,
            }}>
              For informational purposes only. Not financial advice.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
