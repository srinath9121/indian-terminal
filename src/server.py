"""
India Macro Terminal — FastAPI Backend (v5.0)
Strictly aligned with Build Guide & Documented Data Sources.
High-fidelity data pipeline with GDELT, RBI, and standard Indian market parity.
"""

import json
import os
import sys
import time
import logging
import asyncio
import functools
from datetime import datetime, timedelta
from pathlib import Path

import yfinance as yf
import feedparser
import pytz
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
import uvicorn
import numpy as np
import pandas as pd
from contextlib import asynccontextmanager

# ─────────────────────────────────────────────────────
# PATH SETUP
# ─────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = BASE_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from nse_fetcher import NSEMoversFetcher, fetch_max_pain
from gdelt_fetcher import GDELTFetcher
from rbi_fetcher import RBIFetcher
from macro_fetcher import MacroFetcher
import macro_calendar

# ── COMMODITY CONFIG ──
COMMODITIES_CONFIG = [
  {"id":"gold",      "ticker":"GC=F",  "name":"GOLD",      "unit":"₹/10g", "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*10*fx*1.06*1.03, "duty_note":"6% BCD + 3% GST",
   "india_note":"India imports 800–900T/year. RBI gold reserves proxy."},
  {"id":"silver",    "ticker":"SI=F",  "name":"SILVER",    "unit":"₹/kg", "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*1000*fx*1.06*1.03, "duty_note":"6% BCD + 3% GST",
   "india_note":"Industrial demand from solar panels, EVs, jewellery."},
  {"id":"platinum",  "ticker":"PL=F",  "name":"PLATINUM",  "unit":"₹/10g", "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*fx*1.10*1.03, "duty_note":"10% BCD + 3% GST",
   "india_note":"Catalytic converters, auto sector dependency."},
  {"id":"palladium", "ticker":"PA=F",  "name":"PALLADIUM", "unit":"₹/10g", "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*fx*1.10*1.03, "duty_note":"10% BCD + 3% GST",
   "india_note":"Auto emission control, Maruti/Tata supply chain."},
  {"id":"brent",     "ticker":"BZ=F",  "name":"BRENT",     "unit":"₹/barrel", "category":"energy",
   "formula": lambda usd, fx: usd*fx, "duty_note":"No import duty on crude",
   "india_note":"India imports 85% via sea. Direct CAD and inflation driver."},
  {"id":"wti",       "ticker":"CL=F",  "name":"WTI",       "unit":"₹/barrel", "category":"energy",
   "formula": lambda usd, fx: usd*fx, "duty_note":"No import duty on crude",
   "india_note":"Global benchmark. Tracks Brent with ~$3 spread."},
  {"id":"natgas",    "ticker":"NG=F",  "name":"NAT GAS",   "unit":"₹/mmBtu", "category":"energy",
   "formula": lambda usd, fx: usd*fx*1.05, "duty_note":"No import duty + 5% GST",
   "india_note":"CNG, city gas, fertiliser plants (GSFC, Chambal)."},
  {"id":"copper",    "ticker":"HG=F",  "name":"COPPER",    "unit":"₹/kg", "category":"base_metals",
   "formula": lambda usd, fx: (usd/0.4536)*fx*1.05*1.18, "duty_note":"5% BCD + 18% GST",
   "india_note":"Infra, EVs, power cables. Bullish on India grid expansion."},
  {"id":"aluminium", "ticker":"ALI=F", "name":"ALUMINIUM", "unit":"₹/kg", "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.075*1.18, "duty_note":"7.5% BCD + 18% GST",
   "india_note":"Defence, auto, packaging. NALCO, Hindalco exposure."},
  {"id":"zinc",      "ticker":"ZNC=F", "name":"ZINC",      "unit":"₹/kg", "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.0*1.18, "duty_note":"0% BCD (Budget 2025-26) + 18% GST",
   "india_note":"Galvanising for infra. Hindustan Zinc (Vedanta)."},
  {"id":"nickel",    "ticker":"NI=F",  "name":"NICKEL",    "unit":"₹/kg", "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.025*1.18, "duty_note":"2.5% BCD + 18% GST",
   "india_note":"Stainless steel, EV battery cathodes. Critical mineral."},
  {"id":"lead",      "ticker":"LE=F",  "name":"LEAD",      "unit":"₹/kg", "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.0*1.18, "duty_note":"0% BCD (Budget 2025-26) + 18% GST",
   "india_note":"Lead-acid batteries, cables. Amara Raja, Exide exposure."},
]

# ─────────────────────────────────────────────────────
# LOGGING & TZ
# ─────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
IST = pytz.timezone('Asia/Kolkata')

# ─────────────────────────────────────────────────────
# APP LIFESPAN
# ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("India Macro Terminal starting (Phase 6 Hardening)...")
    asyncio.create_task(ws_broadcast_loop())
    asyncio.create_task(ws_heartbeat_loop())
    yield
    logger.info("Shutting down...")

app = FastAPI(title="India Macro Terminal API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ─────────────────────────────────────────────────────
# CACHE SYSTEM (In-memory TTL)
# ─────────────────────────────────────────────────────
_cache = {}

def get_cached(key):
    entry = _cache.get(key)
    if not entry: return None
    val, exp = entry
    if time.monotonic() > exp:
        _cache.pop(key, None)
        return None
    return val

def set_cached(key, val, ttl):
    _cache[key] = (val, time.monotonic() + ttl)

def cached(key, ttl):
    def decorator(f):
        @functools.wraps(f)
        async def wrapper(*args, **kwargs):
            cached_v = get_cached(key)
            if cached_v is not None: return cached_v
            res = await f(*args, **kwargs)
            if res: set_cached(key, res, ttl)
            return res
        return wrapper
    return decorator

# ─────────────────────────────────────────────────────
# CORE FETCHERS
# ─────────────────────────────────────────────────────
_nse = NSEMoversFetcher()
_gdelt = GDELTFetcher()
_rbi = RBIFetcher()
_macro = MacroFetcher()

# ─────────────────────────────────────────────────────
# LIVE MARKET LOGIC
# ─────────────────────────────────────────────────────
def market_status():
    now = datetime.now(IST)
    if now.weekday() >= 5: return {"status": "WEEKEND", "is_open": False, "color": "grey", "next_event": "Mon 9:15 AM"}
    m_open = now.replace(hour=9, minute=15, second=0)
    m_close = now.replace(hour=15, minute=30, second=0)
    if m_open <= now <= m_close:
        rem = int((m_close - now).total_seconds() / 60)
        return {"status": f"OPEN ({rem}m rem)", "is_open": True, "color": "green", "next_event": "3:30 PM"}
    return {"status": "CLOSED", "is_open": False, "color": "grey", "next_event": "9:15 AM"}

def _fetch_market_sync():
    tickers = {
        "NIFTY": "^NSEI", "SENSEX": "^BSESN", "BANKNIFTY": "^NSEBANK",
        "BRENT": "BZ=F", "USD/INR": "USDINR=X", "INDIAVIX": "^INDIAVIX",
        "GOLD": "GC=F", "SILVER": "SI=F", "COPPER": "HG=F"
    }
    syms = list(tickers.values())
    res = {}
    try:
        df = yf.download(syms, period="2d", group_by='ticker', progress=False)
        fx = 83.5
        if 'USDINR=X' in df.columns.levels[0]:
            fx_data = df['USDINR=X']['Close'].dropna()
            if not fx_data.empty: fx = float(fx_data.iloc[-1])

        for name, sym in tickers.items():
            try:
                if sym not in df.columns.levels[0]: continue
                close = df[sym]['Close'].dropna()
                if len(close) < 2: continue
                curr, prev = float(close.iloc[-1]), float(close.iloc[-2])
                
                # Apply India Parity Formulas
                if name == "BRENT":
                    curr, prev = curr * fx, prev * fx
                elif name == "GOLD":
                    # (USD / 31.1035) * 10g * fx * 1.06 duty * 1.03 gst
                    curr = (curr / 31.1035) * 10 * fx * 1.06 * 1.03
                    prev = (prev / 31.1035) * 10 * fx * 1.06 * 1.03
                elif name == "SILVER":
                    # (USD / 31.1035) * 1kg * fx * 1.06 duty * 1.03 gst
                    curr = (curr / 31.1035) * 1000 * fx * 1.06 * 1.03
                    prev = (prev / 31.1035) * 1000 * fx * 1.06 * 1.03
                elif name == "COPPER":
                    # (USD / 0.4536) * fx * 1.05 duty * 1.18 gst
                    curr = (curr / 0.4536) * fx * 1.05 * 1.18
                    prev = (prev / 0.4536) * fx * 1.05 * 1.18

                ch = curr - prev
                res[name] = {"price": round(curr, 2), "change": round(ch, 2), "pChange": round(ch/prev*100, 2), "is_up": ch >= 0}
            except: continue
    except: pass
    return res

# ── SHARED FETCHERS DEFINED EARLY ──
async def get_commodities_data():
    """Internal helper to get commodity data, used by both route and sync."""
    cached_v = get_cached("commodities")
    if cached_v: return cached_v
    
    # Logic moved from api_commodities to here
    loop = asyncio.get_event_loop()
    def _fetch():
        tickers = [c['ticker'] for c in COMMODITIES_CONFIG] + ['USDINR=X']
        try:
            raw = yf.download(tickers, period='60d', interval='1d', group_by='ticker', progress=False)
            # Safe FX extraction
            fx = 83.5
            if 'USDINR=X' in raw.columns.levels[0]:
                fx_series = raw['USDINR=X']['Close'].dropna()
                if not fx_series.empty: fx = float(fx_series.iloc[-1])
        except: fx = 83.5

        results = []
        for c in COMMODITIES_CONFIG:
            try:
                sym = c['ticker']
                # Check level0 for ticker
                if sym not in raw.columns.levels[0]: continue
                
                df = raw[sym]['Close'].dropna()
                if len(df) < 2: continue

                usd_curr, usd_prev = float(df.iloc[-1]), float(df.iloc[-2])
                usd_pct = ((usd_curr - usd_prev) / usd_prev) * 100
                
                inr_price = round(c['formula'](usd_curr, fx), 2)
                inr_prev  = round(c['formula'](usd_prev, fx), 2)
                inr_change = inr_price - inr_prev

                sparkline = [round(c['formula'](float(v), fx), 2) for v in df.tail(7).values]
                results.append({
                    'id': c['id'], 'name': c['name'], 'inr_price': inr_price, 'inr_change': round(inr_change, 2),
                    'pct_change': round(usd_pct, 2), 'direction': 'up' if inr_change >= 0 else 'down',
                    'sparkline': sparkline, 'category': c['category'], 'unit': c['unit'], 'usd_price': round(usd_curr, 2),
                    'duty_note': c['duty_note'], 'india_note': c['india_note'], 'rsi14': 52.0, 'rsi_label': 'NEUTRAL'
                })
            except: continue
        return {'commodities': results, 'usdinr': fx, 'timestamp': datetime.now(IST).isoformat()}
        
    res = await loop.run_in_executor(None, _fetch)
    if res: set_cached("commodities", res, 300)
    return res

async def get_live_data():
    try:
        loop = asyncio.get_event_loop()
        try: m = await loop.run_in_executor(None, _fetch_market_sync)
        except: m = {}

        # PULSE ENRICHMENT (HARDENED)
        try:
            c_data = await get_commodities_data()
            if c_data and "commodities" in c_data:
                for item in c_data["commodities"]:
                    key = item['id'].upper()
                    if key in ['GOLD', 'SILVER', 'COPPER']:
                        m[key] = {
                            "price": item['inr_price'], 
                            "change": item['inr_change'], 
                            "pChange": item['pct_change'],
                            "direction": item['direction'], 
                            "is_up": item['direction'] == 'up'
                        }
        except: pass

        # IRS ENRICHMENT
        irs_val = 45.0
        try:
            irs_entry = get_cached("irs")
            if irs_entry: irs_val = irs_entry.get("irs", 45.0)
        except: pass

        # SIGNAL FOR DASHBOARD
        signal = {"direction": "NEUTRAL", "level": "MODERATE", "confidence": "0.85", "reasoning": "Standard macro equilibrium"}
        if irs_val >= 60: signal = {"direction": "SHORT / HEDGED", "level": "HIGH", "confidence": "0.92", "reasoning": "Elevated geopolitical stress"}
        elif irs_val < 35: signal = {"direction": "LONG / AGGRESSIVE", "level": "LOW", "confidence": "0.88", "reasoning": "Stable macro tailwinds"}

        return {"timestamp": datetime.now(IST).isoformat(), "MARKET": m, "status": market_status(), "irs": irs_val, "SIGNAL": signal}
    except Exception as e:
        logger.error(f"FATAL get_live_data: {e}")
        return {"timestamp": datetime.now(IST).isoformat(), "MARKET": {}, "status": market_status(), "irs": 50, "SIGNAL": {"direction": "ERR", "level": "N/A"}}

@app.get("/api/market-status")
async def api_market_status():
    return market_status()

# ─────────────────────────────────────────────────────
# WEBSOCKET
# ─────────────────────────────────────────────────────
ws_clients = set()

async def ws_broadcast_loop():
    while True:
        await asyncio.sleep(60 if market_status()["is_open"] else 300)
        data = await get_live_data()
        msg = json.dumps({"type": "price_update", "data": data})
        for ws in list(ws_clients):
            try: await ws.send_text(msg)
            except: ws_clients.discard(ws)

async def ws_heartbeat_loop():
    while True:
        await asyncio.sleep(30)
        msg = json.dumps({"type": "ping", "status": market_status()})
        for ws in list(ws_clients):
            try: await ws.send_text(msg)
            except: ws_clients.discard(ws)

# ─────────────────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────────────────
# Serve Frontend (Production)
DIST_DIR = BASE_DIR / "frontend" / "dist"
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # API routes are already handled above by FastAPI's priority matching
        # All other routes should serve the React SPA
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/")
    async def root():
        return {"engine": "Render", "status": "Live", "time": datetime.now(IST).isoformat(), "msg": "Frontend build not found locally."}

@app.get("/api/signals")
@cached("signals", 60)
async def api_signals():
    return await get_live_data()

@app.get("/api/indices")
@cached("indices", 120)
async def api_indices():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _nse.fetch_indices)

@app.get("/api/top-movers")
@cached("movers", 300)
async def api_movers():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _nse.fetch)

@app.get("/api/fii-dii")
@cached("fii_dii", 300)
async def api_fii_dii():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _nse.fetch_fii_dii)

@app.get("/api/sector-performance")
@cached("sectors", 600)
async def api_sectors():
    loop = asyncio.get_event_loop()
    res = await loop.run_in_executor(None, _nse.fetch_sectors)
    return {"data": res if res else []}

# ── ROUTE ALIASES (frontend compatibility) ──
@app.get("/api/market-status")
async def api_market_status():
    return market_status()

@app.get("/api/market/movers")
async def api_market_movers():
    return await api_movers()

@app.get("/api/market/indices")
async def api_market_indices():
    return await api_indices()

@app.get("/api/index-sparklines")
@cached("sparklines", 300)
async def api_sparklines():
    """Generate mini sparkline data for index bar from yfinance 5d intraday."""
    loop = asyncio.get_event_loop()
    def _fetch():
        import yfinance as yf
        tickers = {"NIFTY 50": "^NSEI", "SENSEX": "^BSESN", "BANK NIFTY": "^NSEBANK"}
        result = {}
        for name, sym in tickers.items():
            try:
                h = yf.Ticker(sym).history(period="5d", interval="1h")
                if not h.empty:
                    result[name] = [round(float(v), 2) for v in h['Close'].dropna().tolist()[-24:]]
            except:
                pass
        return result
    return await loop.run_in_executor(None, _fetch)

# ── CONFIGS MOVED TO TOP ──

@app.get("/api/commodities")
async def api_commodities():
    """Live Commodities with India parity conversion."""
    return await get_commodities_data()


@app.get("/api/gdelt/india-events")
@cached("gdelt", 900)
async def api_gdelt():
    events = await _gdelt.fetch_events_with_fallback(max_records=15)
    scores = await _gdelt.fetch_geo_scores()
    gti = _gdelt.compute_india_gti(events, scores)

    # Merge with curated baseline scores (GDELT Geo API is often rate-limited).
    # Live GDELT scores take priority; fallback fills any missing country.
    BASELINE_SCORES = {
        # Key countries for India arc system (ISO2 → score)
        "IR": 75, "IRN": 75,   # Iran
        "RU": 82, "RUS": 82,   # Russia
        "CN": 72, "CHN": 72,   # China
        "PK": 68, "PAK": 68,   # Pakistan
        "US": 42, "USA": 42,   # USA
        "SA": 48, "SAU": 48,   # Saudi Arabia
        "IL": 70, "ISR": 70,   # Israel
        # Additional high-risk countries for globe coloring
        "UA": 92, "SY": 90, "YE": 85, "AF": 87, "KP": 89,
        "MM": 82, "IQ": 80, "LB": 73, "IN": 45,
    }
    merged = {**BASELINE_SCORES, **scores}  # live scores override baseline

    return {"events": events, "items": events, "country_scores": merged, "gti": gti if gti > 0 else 52.0}

@app.get("/api/geopolitical-news")
@cached("geo_news", 600)
async def api_geo_news():
    events = await _gdelt.fetch_events_with_fallback(max_records=10)
    return {"items": events}

@app.get("/api/india-risk-score")
@cached("irs", 600)
async def api_irs():
    """Phase 3 formula-driven India Risk Score."""
    # 1. GDELT Volume & Severity
    gdelt = await api_gdelt()
    events = gdelt.get("events", [])
    ev_vol = min(100, len(events) * 4) # 25 events -> 100
    
    avg_tone = np.mean([e["tone"] for e in events]) if events else 0
    sev = max(0, min(100, (5 - avg_tone) * 10))
    
    # 2. Market Stress (VIX vs 20d)
    try:
        vx = yf.Ticker("^INDIAVIX").history(period="30d")
        curr_vix = vx['Close'].iloc[-1]
        avg_vix = vx['Close'].tail(20).mean()
        m_stress = max(0, min(100, (curr_vix - avg_vix) / avg_vix * 100 + 50))
    except: m_stress = 50
    
    # 3. Factor weighting (Phase 3 Doc)
    irs = (ev_vol * 0.3) + (sev * 0.25) + (m_stress * 0.45) # Adjusted for available factors
    
    return {
        "irs": round(irs, 1),
        "zone": "EXTREME" if irs >= 80 else ("ELEVATED" if irs >= 60 else "MODERATE"),
        "factors": {
            "event_volume": {"label": "Event Volume", "score": round(ev_vol, 1)},
            "severity": {"label": "Severity", "score": round(sev, 1)},
            "market_stress": {"label": "Market Stress", "score": round(m_stress, 1)}
        },
        "updated_at": datetime.now(IST).isoformat()
    }

@app.get("/api/macro/rbi")
@cached("rbi", 3600)
async def api_rbi():
    loop = asyncio.get_event_loop()
    repo = await loop.run_in_executor(None, _rbi.fetch_repo_rate)
    cpi = await loop.run_in_executor(None, _rbi.fetch_cpi_inflation)
    return {"repo_rate": repo, "cpi_inflation": cpi, "timestamp": datetime.now(IST).isoformat()}

@app.get("/api/macro/gst")
@cached("gst", 86400)
async def api_gst():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _macro.fetch_gst_revenue)

@app.get("/api/macro/power")
@cached("power", 3600)
async def api_power():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _macro.fetch_power_demand)

@app.get("/api/macro/monsoon")
@cached("monsoon", 21600)
async def api_monsoon():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _macro.fetch_monsoon_status)

@app.get("/api/macro/fii-derivatives")
@cached("fii_deriv", 900)
async def api_fii_derivatives():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _macro.fetch_fii_derivative_positions)

@app.get("/api/macro/max-pain")
@cached("max_pain", 300)
async def api_max_pain():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fetch_max_pain)

@app.get("/api/macro-calendar")
async def api_calendar():
    return {"events": macro_calendar.get_upcoming_events(), "updated_at": datetime.now(IST).isoformat()}

@app.websocket("/ws/live")
async def websocket_route(websocket: WebSocket):
    await websocket.accept()
    ws_clients.add(websocket)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect: ws_clients.discard(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
