import { useState, useEffect } from 'react';
import OverviewTab from './components/OverviewTab';
import SignalsTab from './components/SignalsTab';
import AnalysisTab from './components/AnalysisTab';
import LegalTab from './components/LegalTab';
import NewsTab from './components/NewsTab';
import Dashboard from './components/Dashboard';

const TICKER_SYMBOLS = [
  'ADANIENT', 'ADANIPORTS', 'ADANIGREEN', 'ADANIPOWER', 'ATGL', 
  'AWL', 'ADANIENSOL', 'ACC', 'AMBUJACEM', 'NDTV', 
  'RELIANCE', 'SBIN', 'NIFTY'
];

// Mock data generator for ticker
const generateMockTickerData = () => {
  return TICKER_SYMBOLS.map(symbol => {
    const isUp = Math.random() > 0.5;
    const change = (Math.random() * 50).toFixed(2);
    const pct = (Math.random() * 3).toFixed(2);
    const price = (Math.random() * 3000 + 100).toFixed(2);
    return { symbol, price, change, pct, isUp };
  });
};

const TABS = ['Overview', 'Signals', 'Analysis', 'Legal', 'News'];

// ────── DOT COMPONENT ──────
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
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status] || colors.loading }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#4B5563', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  );
}

export default function App() {
  const [tickerData, setTickerData] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [stockDetails, setStockDetails] = useState(null);

  useEffect(() => {
    // Initial mock data
    setTickerData(generateMockTickerData());
    
    // Refresh ticker every minute
    const id = setInterval(() => {
      setTickerData(generateMockTickerData());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch or set mock details when stock changes
  useEffect(() => {
    if (!selectedStock) {
      setStockDetails(null);
    } else {
      setStockDetails({
        name: selectedStock === 'NIFTY' ? 'Nifty 50 Index' : selectedStock === 'RELIANCE' ? 'Reliance Industries Ltd' : selectedStock + ' Ltd',
        symbol: selectedStock,
        price: '3,145.20',
      change: '45.80',
      pct: '1.45',
      isUp: true,
      layers: {
        OPTIONS: 'critical',
        MACRO: 'watch',
        LEGAL: 'active',
        SMART: 'clear',
        SENTIMENT: 'critical'
      },
      info: {
        prevClose: '3,099.40',
        dayRange: '3,100.00 - 3,160.00',
        yearRange: '2,100.00 - 3,500.00',
        marketCap: '3.50L',
        promoterPledge: 45, // amber
        fiiHolding: '18.5',
        fiiDelta: -1.2
      }
    });
    }
  }, [selectedStock]);

  const getPledgeColor = (val) => val > 60 ? '#EF4444' : val > 40 ? '#F59E0B' : '#10B981';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ────── TOP TICKER BAR ────── */}
      <div style={{ 
        width: '100%', height: 40, background: '#FFFFFF', 
        borderBottom: '1px solid #E5E7EB', overflow: 'hidden',
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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.symbol}</span>
              <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#4B5563' }}>{item.price}</span>
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
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
                    {stockDetails.name}
                  </h1>
                  <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>{stockDetails.symbol}</span>
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
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: '#111827' }}>
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
                background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, 
                padding: '16px 20px', width: 320 
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', marginBottom: 12 }}>
                  TRADING INFORMATION
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#6B7280' }}>Previous Close</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>₹{stockDetails.info.prevClose}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#6B7280' }}>Day Range</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>₹{stockDetails.info.dayRange}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#6B7280' }}>52-Week Range</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>₹{stockDetails.info.yearRange}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#6B7280' }}>Market Cap</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>₹{stockDetails.info.marketCap} Cr</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#6B7280' }}>Promoter Pledge</span>
                    <span style={{ 
                      fontFamily: "'Space Mono', monospace", fontWeight: 700, 
                      color: getPledgeColor(stockDetails.info.promoterPledge) 
                    }}>
                      {stockDetails.info.promoterPledge}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#6B7280' }}>FII Holding</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>
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
            <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #E5E7EB', marginBottom: 24 }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0 0 12px 0', fontSize: 14, fontWeight: 600,
                    color: activeTab === tab ? '#0077CC' : '#6B7280',
                    borderBottom: activeTab === tab ? '2px solid #0077CC' : '2px solid transparent',
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
              {activeTab === 'Signals' && (
                <SignalsTab symbol={selectedStock} />
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
      <div style={{ background: '#FEF2F2', borderTop: '1px solid #FECACA', padding: '12px 32px', textAlign: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', fontFamily: "'Inter', sans-serif" }}>
          WARNING SYSTEM: This is a detection tool, not a prediction engine or investment advisor. Not registered with SEBI. Not financial advice. Past detection patterns do not guarantee future accuracy. All signals require human judgment before any action.
        </span>
      </div>

    </div>
  );
}
