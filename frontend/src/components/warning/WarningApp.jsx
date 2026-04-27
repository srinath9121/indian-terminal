import { useState, useEffect } from 'react';
import OverviewTab from './OverviewTab';
import OptionsTab from './OptionsTab';
import AnalysisTab from './AnalysisTab';
import LegalTab from './LegalTab';
import NewsTab from './NewsTab';
import Dashboard from './Dashboard';
import WarningPulse from './WarningPulse';

const TICKER_SYMBOLS = [
  'ADANIENT', 'ADANIPORTS', 'ADANIGREEN', 'ADANIPOWER', 'ATGL', 
  'ADANIWILM', 'ADANIENSOL', 'ACC', 'AMBUJACEM', 'NDTV', 
  'RELIANCE', 'SBIN'
];

const fetchTickerData = async () => {
  try {
    const resp = await fetch('/warning/api/danger-score/batch');
    if (!resp.ok) throw new Error('API error');
    const d = await resp.json();
    return (d.stocks || []).map(s => ({
      symbol: s.symbol,
      price: s.price || s.danger_score || 0,
      change: s.change || '0', 
      pct: s.pct || '0', 
      isUp: s.isUp !== undefined ? s.isUp : true,
      dangerScore: s.danger_score || 0,
      signal: s.final_signal || 'CLEAR',
    }));
  } catch (e) {
    return TICKER_SYMBOLS.map(symbol => ({ symbol, price: 0, change: '0', pct: '0', isUp: true, dangerScore: 0, signal: 'CLEAR' }));
  }
};

const TABS = ['Overview', 'Options', 'Analysis', 'Legal', 'News'];

// ────── STATUS DOT ──────
function StatusDot({ label, status }) {
  const colors = {
    critical: '#EF4444',
    active: '#F59E0B',
    watch: '#8B5CF6',
    clear: '#10B981',
    loading: '#9CA3AF'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status] || colors.loading, boxShadow: `0 0 8px ${colors[status] || colors.loading}` }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  );
}

function MiniRadar() {
  return (
    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: '1px solid #333', overflow: 'hidden', background: 'radial-gradient(circle, #1a0505 0%, #000 70%)', marginRight: 16 }}>
      <div className="radar-grid" />
      <div className="radar-sweep" />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, background: '#EF4444', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 6px #EF4444' }} />
    </div>
  );
}

export default function App() {
  const [tickerData, setTickerData] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [stockDetails, setStockDetails] = useState(null);

  useEffect(() => {
    fetchTickerData().then(setTickerData);
    const id = setInterval(() => fetchTickerData().then(setTickerData), 300000);
    return () => clearInterval(id);
  }, []);

  // Fetch real details when stock changes
  useEffect(() => {
    if (!selectedStock) { setStockDetails(null); return; }
    const load = async () => {
      try {
        const [dangerResp, smartResp] = await Promise.all([
          fetch(`/warning/api/danger-score/${selectedStock}`),
          fetch(`/warning/api/smart-money/${selectedStock}`),
        ]);
        const danger = dangerResp.ok ? await dangerResp.json() : {};
        const smart = smartResp.ok ? await smartResp.json() : {};
        const getS = (v) => v > 75 ? 'critical' : v > 50 ? 'active' : v > 25 ? 'watch' : 'clear';
        const layers = danger.layers || {};
        setStockDetails({
          name: selectedStock + ' Ltd', symbol: selectedStock,
          price: '—', change: '—', pct: '—', isUp: true,
          layers: {
            OPTIONS: getS(layers.options_anomaly || 0),
            MACRO: getS(layers.macro_pressure || 0),
            LEGAL: getS(layers.legal_risk || 0),
            SMART: getS(layers.smart_money || 0),
            SENTIMENT: getS(layers.sentiment_velocity || 0),
          },
          info: {
            prevClose: '—', dayRange: '—', yearRange: '—',
            marketCap: '—',
            promoterPledge: smart.pledge_pct || 0,
            fiiHolding: '—', fiiDelta: 0,
            dangerScore: danger.danger_score || 0,
            signal: danger.final_signal || 'CLEAR',
          }
        });
      } catch (e) { console.warn('Stock detail fetch error:', e); }
    };
    load();
  }, [selectedStock]);

  const getPledgeColor = (val) => val > 60 ? '#EF4444' : val > 40 ? '#F59E0B' : '#10B981';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#050505' }}>
      
      {/* ────── TOP TICKER BAR ────── */}
      <div style={{ 
        width: '100%', height: 40, background: '#0D0D1A', 
        borderBottom: '1px solid #1F2937', overflow: 'hidden',
        display: 'flex', alignItems: 'center'
      }}>
        <div className="marquee-content" style={{ display: 'flex', gap: 32, paddingLeft: 32 }}>
          {/* Double array for seamless loop */}
          {[...tickerData, ...tickerData].map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedStock(item.symbol)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: '#F3F4F6' }}>{item.symbol}</span>
              <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#9CA3AF' }}>{item.price}</span>
              <span style={{ 
                fontSize: 12, fontWeight: 600, 
                color: item.isUp ? '#10B981' : '#EF4444',
                display: 'flex', alignItems: 'center', gap: 2
              }}>
                {item.isUp ? '▲' : '▼'} {item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ────── MAIN CONTENT ────── */}
      <div style={{ flex: 1, padding: '24px 32px', maxWidth: selectedStock ? 1400 : 1600, margin: '0 auto', width: '100%' }}>
        
        {/* HEADER: TITLE AND RADAR */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, borderBottom: '1px solid #1F2937', paddingBottom: 16 }}>
          <MiniRadar />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#EF4444', letterSpacing: '0.1em' }}>
              ADANI RISK RADAR
            </h1>
            <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: "'Space Mono', monospace" }}>
              SYSTEMIC EARLY WARNING DASHBOARD
            </div>
          </div>
        </div>

        {!selectedStock ? (
          <Dashboard onSelectStock={setSelectedStock} />
        ) : stockDetails && (
          <>
            {/* ────── STOCK HEADER ────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              
              {/* Left Side: Back Button, Name, Price, Layers */}
              <div>
                <button 
                  onClick={() => setSelectedStock(null)}
                  style={{ 
                    background: 'transparent', border: 'none', color: '#6B7280', 
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 4 
                  }}
                >
                  ← Back to Dashboard
                </button>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#F9FAFB' }}>
                    {stockDetails.name}
                  </h1>
                  <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>{stockDetails.symbol}</span>
                </div>

                {/* 5 Layer Dots */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <StatusDot label="OPTIONS" status={stockDetails.layers.OPTIONS} />
                  <StatusDot label="MACRO" status={stockDetails.layers.MACRO} />
                  <StatusDot label="LEGAL" status={stockDetails.layers.LEGAL} />
                  <StatusDot label="SMART" status={stockDetails.layers.SMART} />
                  <StatusDot label="SENTIMENT" status={stockDetails.layers.SENTIMENT} />
                </div>

                {/* Price & Change */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: '#F9FAFB' }}>
                    ₹{stockDetails.price}
                  </span>
                  <span style={{ 
                    fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, 
                    color: stockDetails.isUp ? '#10B981' : '#EF4444' 
                  }}>
                    {stockDetails.isUp ? '▲' : '▼'} {stockDetails.change} ({stockDetails.isUp ? '+' : ''}{stockDetails.pct}%)
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' }}>
                  3-min delayed · Market Open
                </div>
              </div>

              {/* Right Side: Trading Information Panel */}
              <div style={{ 
                background: '#0D0D1A', border: '1px solid #1F2937', borderRadius: 8, 
                padding: '16px 20px', width: 320 
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: 12 }}>
                  TRADING INFORMATION
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>Previous Close</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600, color: '#D1D5DB' }}>₹{stockDetails.info.prevClose}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>Day Range</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600, color: '#D1D5DB' }}>₹{stockDetails.info.dayRange}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>52-Week Range</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600, color: '#D1D5DB' }}>₹{stockDetails.info.yearRange}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>Market Cap</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600, color: '#D1D5DB' }}>₹{stockDetails.info.marketCap} Cr</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>Promoter Pledge</span>
                    <span style={{ 
                      fontFamily: "'Space Mono', monospace", fontWeight: 700, 
                      color: getPledgeColor(stockDetails.info.promoterPledge) 
                    }}>
                      {stockDetails.info.promoterPledge}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF' }}>FII Holding</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600, color: '#D1D5DB' }}>
                      {stockDetails.info.fiiHolding}% 
                      <span style={{ color: stockDetails.info.fiiDelta > 0 ? '#10B981' : '#EF4444', marginLeft: 6 }}>
                        {stockDetails.info.fiiDelta > 0 ? '▲' : '▼'}{Math.abs(stockDetails.info.fiiDelta)}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ────── TABS ────── */}
            <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #1F2937', marginBottom: 24 }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0 0 12px 0', fontSize: 14, fontWeight: 600,
                    color: activeTab === tab ? '#EF4444' : '#6B7280',
                    borderBottom: activeTab === tab ? '2px solid #EF4444' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ────── TAB CONTENT AREA (To be built in W-2, W-3, etc) ────── */}
            <div>
              {activeTab === 'Overview' && (
                <OverviewTab symbol={selectedStock} />
              )}
              {activeTab === 'Options' && (
                <OptionsTab symbol={selectedStock} />
              )}
              {activeTab === 'Analysis' && (
                <AnalysisTab symbol={selectedStock} />
              )}
              {activeTab === 'Legal' && (
                <LegalTab symbol={selectedStock} />
              )}
              {activeTab === 'News' && (
                <NewsTab symbol={selectedStock} />
              )}
            </div>

          </>
        )}

      </div>

      {/* ────── GLOBAL DISCLAIMER ────── */}
      <div style={{ background: '#110000', borderTop: '1px solid #550000', padding: '12px 32px', textAlign: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', fontFamily: "'Inter', sans-serif" }}>
          WARNING SYSTEM: This is a detection tool, not a prediction engine or investment advisor. Not registered with SEBI. Not financial advice. Past detection patterns do not guarantee future accuracy. All signals require human judgment before any action.
        </span>
      </div>

    </div>
  );
}
