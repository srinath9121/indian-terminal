import { useState, useEffect, useRef, useCallback } from 'react';
import { safeFetch } from './utils/api';
import Pulse from './pages/Pulse.jsx';
import Macro from './pages/Macro.jsx';
import GeoMap from './pages/GeoMap.jsx';
import Markets from './pages/Markets.jsx';
import Commodities from './pages/Commodities.jsx';
import Backtest from './pages/Backtest.jsx';
import AlertsHistory from './pages/AlertsHistory.jsx';
import WarningApp from './components/warning/WarningApp.jsx';

const TABS = ['PULSE', 'MACRO', 'GEO MAP', 'MARKETS', 'COMMODITIES', 'RISK RADAR', 'BACKTEST', 'ALERTS'];

export default function App() {
  const [activeTab, setActiveTab] = useState('PULSE');
  const [liveData, setLiveData] = useState(null);
  const [wsStatus, setWsStatus] = useState('CONNECTING...');
  const [marketStatus, setMarketStatus] = useState(null);
  const [gtiValue, setGtiValue] = useState(null);
  const [gtiLabel, setGtiLabel] = useState(null);
  const [clock, setClock] = useState('');
  const [showScanline, setShowScanline] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(3000);

  // ────── IST CLOCK ──────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
      const hh = String(ist.getUTCHours()).padStart(2, '0');
      const mm = String(ist.getUTCMinutes()).padStart(2, '0');
      const ss = String(ist.getUTCSeconds()).padStart(2, '0');
      setClock(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ────── WEBSOCKET ──────
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('LIVE');
      reconnectDelayRef.current = 3000;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'price_update') {
          setLiveData(msg.data);
          if (msg.data?.market_status) setMarketStatus(msg.data.market_status);
          if (msg.data?.gti != null) setGtiValue(msg.data.gti);
        } else if (msg.type === 'heartbeat') {
          if (msg.market_status) setMarketStatus(msg.market_status);
          // Respond to implicit ping
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        }
      } catch (e) {
        console.warn('WS parse error:', e);
      }
    };

    ws.onclose = () => {
      setWsStatus('RECONNECTING...');
      const delay = reconnectDelayRef.current;
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(delay * 2, 30000);
        connectWebSocket();
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectWebSocket]);

  // ────── GTI BADGE (fetch independently) ──────
  useEffect(() => {
    const fetchGti = async () => {
      const data = await safeFetch('/api/gdelt/india-events');
      if (data) {
        setGtiValue(data.gti);
        if (data.gti_label) setGtiLabel(data.gti_label);
      }
    };
    fetchGti();
    const id = setInterval(fetchGti, 120000); // 2 minutes
    return () => clearInterval(id);
  }, []);

  // ────── COMMODITY DATA (Centralized) ──────
  const [commodityData, setCommodityData] = useState(null);
  useEffect(() => {
    const fetchComms = async () => {
      const res = await safeFetch('/api/commodities');
      if (res && res.commodities) setCommodityData(res.commodities);
    };
    fetchComms();
    const id = setInterval(fetchComms, 300000); // 5 minutes
    return () => clearInterval(id);
  }, []);

  // ────── TAB SWITCH WITH SCANLINE ──────
  const handleTabSwitch = (tab) => {
    if (tab === activeTab) return;
    setShowScanline(true);
    setTimeout(() => {
      setActiveTab(tab);
      setShowScanline(false);
    }, 300);
  };

  // ────── GTI BADGE COLOR ──────
  // GTI badge colors per design doc
  const getGtiColor = (val) => {
    if (val == null) return '#6B7280';
    if (val >= 80) return '#EF4444';
    if (val >= 60) return '#F97316';
    if (val >= 35) return '#EAB308';
    return '#22C55E';
  };
  const getGtiBg = (val) => {
    if (val == null) return 'transparent';
    if (val >= 80) return '#7F1D1D';
    if (val >= 60) return '#7C2D12';
    if (val >= 35) return '#713F12';
    return '#14532D';
  };

  // ────── STYLES ──────
  const styles = {
    app: {
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      flexDirection: 'column',
    },
    navbar: {
      width: '100%',
      height: 48,
      background: '#0F0F0F',
      borderBottom: '1px solid #333333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    logo: {
      fontFamily: "'Courier New', monospace",
      fontSize: 14,
      color: '#E0E0D0',
      fontWeight: 'bold',
      letterSpacing: '2px',
      cursor: 'pointer',
      userSelect: 'none',
    },
    tabContainer: {
      display: 'flex',
      gap: 0,
    },
    tab: (isActive) => ({
      fontFamily: "'Courier New', monospace",
      fontSize: 11,
      fontWeight: 'bold',
      padding: '6px 18px',
      cursor: 'pointer',
      border: 'none',
      borderBottom: 'none',
      background: isActive ? '#111111' : 'transparent',
      color: isActive ? '#C8B87A' : '#555555',
      letterSpacing: '2px',
      transition: 'none',
    }),
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    },
    wsIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    wsText: {
      fontFamily: "'Courier New', monospace",
      fontSize: 12,
      color: wsStatus === 'LIVE' ? '#22C55E' : '#C8B87A',
      fontWeight: 'bold',
      letterSpacing: '2px',
    },
    clockText: {
      fontFamily: "'Courier New', monospace",
      fontSize: 12,
      color: '#E0E0D0',
      fontWeight: 'bold',
      letterSpacing: '2px',
    },
    gtiBadge: {
      fontFamily: "'Courier New', monospace",
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 0,
      color: getGtiColor(gtiValue),
      background: getGtiBg(gtiValue),
      border: '1px solid #333333',
    },
    content: {
      flex: 1,
      marginTop: 48,
      position: 'relative',
    },
    scanlineOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
      pointerEvents: 'none',
      background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.08) 50%, transparent 100%)',
      animation: 'scanline 0.3s linear',
    },
  };

  return (
    <div style={styles.app}>
      {/* ────── NAVBAR ────── */}
      <nav style={styles.navbar}>
        {/* LEFT: Logo */}
        <div style={styles.logo} onClick={() => handleTabSwitch('PULSE')}>
          INDIA MACRO TERMINAL
        </div>

        {/* CENTER: Tabs */}
        <div style={styles.tabContainer}>
          {TABS.map((tab) => (
            <button
              key={tab}
              style={styles.tab(activeTab === tab)}
              onClick={() => handleTabSwitch(tab)}
              onMouseEnter={(e) => {
                if (activeTab !== tab) e.target.style.color = '#AAAAAA';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) e.target.style.color = '#555B66';
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* RIGHT: Status indicators */}
        <div style={styles.rightSection}>
          {/* WS Status */}
          <div style={styles.wsIndicator}>
            <div style={{
              width: 6, height: 6, background: '#22C55E', borderRadius: '50%',
              animation: 'blink 1.2s step-end infinite',
              display: wsStatus === 'LIVE' ? 'block' : 'none'
            }} />
            <span style={styles.wsText}>{wsStatus === 'LIVE' ? 'LIVE' : wsStatus}</span>
          </div>

          {/* Clock */}
          <span style={styles.clockText}>{clock} IST</span>

          {/* GTI Badge */}
          <span style={styles.gtiBadge}>
            GTI: {gtiValue != null ? Math.round(gtiValue) : '--'}
          </span>
        </div>
      </nav>

      {/* ────── CONTENT ────── */}
      <div style={styles.content}>
        {showScanline && <div style={styles.scanlineOverlay} />}
        <div className="fade-in" key={activeTab}>
          {activeTab === 'PULSE' && <Pulse liveData={liveData} />}
          {activeTab === 'MACRO' && <Macro />}
          {activeTab === 'GEO MAP' && <GeoMap commodityData={commodityData} />}
          {activeTab === 'MARKETS' && <Markets />}
          {activeTab === 'COMMODITIES' && <Commodities commodityData={commodityData} />}
          {activeTab === 'RISK RADAR' && (
            <div style={{ margin: '-24px' }}>
              <WarningApp />
            </div>
          )}
          {activeTab === 'BACKTEST' && <Backtest />}
          {activeTab === 'ALERTS' && <AlertsHistory />}
        </div>
      </div>

      {/* ────── GLOBAL DISCLAIMER ────── */}
      <div style={{ background: '#0D1525', borderTop: '1px solid #1E293B', padding: '10px 20px', textAlign: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: '#38BDF8', fontFamily: "'Inter', sans-serif" }}>
          MACRO TERMINAL: Commodity prices sourced from CMX/ICE/NYM via yfinance with INR parity conversion. NOT sourced from MCX directly. 15-minute price delay. For informational purposes only.
        </span>
      </div>

    </div>
  );
}
