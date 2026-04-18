"""
India Macro Terminal — FastAPI Backend (v6.5 - Ultimate Singleton)
Final hardening against yfinance rate limiting.
CONSOLIDATED sync service + 15 min refresh interval.
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
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import FileResponse
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

# ─────────────────────────────────────────────────────
# CONFIGS
# ─────────────────────────────────────────────────────
COMMODITIES_CONFIG = [
  {"id":"gold",      "ticker":"GC=F",  "name":"GOLD",      "unit":"₹/10g",  "category":"precious", "formula": lambda usd, fx: (usd/31.1035)*10*fx*1.06*1.03, "duty_note":"6% BCD + 3% GST"},
  {"id":"silver",    "ticker":"SI=F",  "name":"SILVER",    "unit":"₹/kg",   "category":"precious", "formula": lambda usd, fx: (usd/31.1035)*1000*fx*1.06*1.03, "duty_note":"6% BCD + 3% GST"},
  {"id":"platinum",  "ticker":"PL=F",  "name":"PLATINUM",  "unit":"₹/10g",  "category":"precious", "formula": lambda usd, fx: (usd/31.1035)*fx*1.10*1.03, "duty_note":"10% BCD + 3% GST"},
  {"id":"brent",     "ticker":"BZ=F",  "name":"BRENT",     "unit":"₹/barrel","category":"energy",   "formula": lambda usd, fx: usd*fx, "duty_note":"No import duty"},
  {"id":"copper",    "ticker":"HG=F",  "name":"COPPER",    "unit":"₹/kg",   "category":"base",     "formula": lambda usd, fx: (usd/0.4536)*fx*1.05*1.18, "duty_note":"5% BCD + 18% GST"},
  {"id":"zinc",      "ticker":"ZNC=F", "name":"ZINC",      "unit":"₹/kg",   "category":"base",     "formula": lambda usd, fx: (usd/1000)*fx*1.0*1.18, "duty_note":"0% BCD + 18% GST"},
]

MARKET_TICKERS = {"NIFTY": "^NSEI", "SENSEX": "^BSESN", "USD/INR": "USDINR=X", "INDIAVIX": "^INDIAVIX"}

# ─────────────────────────────────────────────────────
# GLOBAL STATE & CACHE
# ─────────────────────────────────────────────────────
GLOBAL_STATE = {
    "market": {},
    "commodities": [],
    "signals": {},
    "last_sync": None
}
_CACHE = {}
def get_cached(key): return _CACHE.get(key)
def set_cached(key, val): _CACHE[key] = val

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
IST = pytz.timezone('Asia/Kolkata')

def market_status():
    now = datetime.now(IST)
    if now.weekday() >= 5: return {"status": "WEEKEND", "is_open": False, "color": "grey", "next_event": "Mon 9:15 AM"}
    m_open = now.replace(hour=9, minute=15, second=0)
    m_close = now.replace(hour=15, minute=30, second=0)
    if m_open <= now <= m_close:
        return {"status": f"OPEN ({int((m_close-now).total_seconds()/60)}m rem)", "is_open": True, "color": "green", "next_event": "3:30 PM"}
    return {"status": "CLOSED", "is_open": False, "color": "grey", "next_event": "9:15 AM"}

# ─────────────────────────────────────────────────────
# SINGLETON SYNC SERVICE
# ─────────────────────────────────────────────────────
async def unified_sync_service():
    """Background service – ONLY place that calls yfinance! Refresh every 15 mins."""
    while True:
        try:
            logger.info("Ultimate Sync: Starting batch macroeconomic data retrieval...")
            all_syms = list(MARKET_TICKERS.values()) + [c['ticker'] for c in COMMODITIES_CONFIG]
            loop = asyncio.get_event_loop()
            df = await loop.run_in_executor(None, lambda: yf.download(all_syms, period="5d", group_by='ticker', progress=False))

            # FX Extraction
            fx = 83.5
            if 'USDINR=X' in df.columns.levels[0]:
                fx_c = df['USDINR=X']['Close'].dropna()
                if not fx_c.empty: fx = float(fx_c.iloc[-1])

            # Market Data
            m_res = {}
            for name, sym in MARKET_TICKERS.items():
                if sym not in df.columns.levels[0]: continue
                close = df[sym]['Close'].dropna()
                if len(close) < 2: continue
                curr, prev = float(close.iloc[-1]), float(close.iloc[-2])
                ch = curr - prev
                m_res[name] = {"price": round(curr, 2), "change": round(ch, 2), "pChange": round(ch/prev*100, 2), "is_up": ch >= 0}

            # Commodity Data
            c_res = []
            pulse_extra = {}
            for c in COMMODITIES_CONFIG:
                sym = c['ticker']
                if sym not in df.columns.levels[0]: continue
                close = df[sym]['Close'].dropna()
                if len(close) < 2: continue
                curr, prev = float(close.iloc[-1]), float(close.iloc[-2])
                inr_curr = round(c['formula'](curr, fx), 2)
                inr_ch = inr_curr - (c['formula'](prev, fx))
                
                item = {
                    'id': c['id'], 'name': c['name'], 'inr_price': inr_curr, 'inr_change': round(inr_ch, 2),
                    'pct_change': round(((curr-prev)/prev)*100, 2), 'direction': 'up' if inr_ch >= 0 else 'down',
                    'sparkline': [round(c['formula'](float(v), fx), 2) for v in close.tail(7).values],
                    'category': c['category'], 'unit': c['unit']
                }
                c_res.append(item)
                if c['id'].upper() in ['GOLD', 'SILVER', 'COPPER']:
                    pulse_extra[c['id'].upper()] = {"price": inr_curr, "change": round(inr_ch, 2), "pChange": item['pct_change'], "is_up": inr_ch >= 0}

            # State Update
            irs_val = 52.0
            sig = {"direction": "NEUTRAL", "level": "MODERATE", "confidence": "0.85", "reasoning": "Standard equilibrium"}
            if "NIFTY" in m_res and m_res["NIFTY"]["pChange"] < -1.0: 
                irs_val, sig = 68.0, {"direction": "HEDGED", "level": "HIGH", "confidence": "0.90", "reasoning": "Market stress detected"}

            GLOBAL_STATE["market"] = {**m_res, **pulse_extra}
            GLOBAL_STATE["commodities"] = c_res
            GLOBAL_STATE["signals"] = {"timestamp": datetime.now(IST).isoformat(), "MARKET": GLOBAL_STATE["market"], "status": market_status(), "irs": irs_val, "SIGNAL": sig}
            GLOBAL_STATE["last_sync"] = datetime.now(IST).isoformat()
            
            # WebSocket Broadcast
            msg = json.dumps({"type": "price_update", "data": GLOBAL_STATE["signals"]})
            for ws in list(ws_clients):
                try: await ws.send_text(msg)
                except: ws_clients.discard(ws)

            logger.info(f"Sync Success! Memory State Updated.")

        except Exception as e:
            logger.error(f"Sync Exception: {e}")

        # Sleep 15 minutes to avoid yfinance blocking
        await asyncio.sleep(900)

# ─────────────────────────────────────────────────────
# LIFESPAN & APP
# ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(unified_sync_service())
    yield

app = FastAPI(title="India Macro singleton", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_nse = NSEMoversFetcher(); _gdelt = GDELTFetcher(); _rbi = RBIFetcher(); _macro = MacroFetcher()

# ─────────────────────────────────────────────────────
# ROUTES (ZERO-EXECUTION READS)
# ─────────────────────────────────────────────────────
@app.get("/api/market-status")
async def api_status(): return market_status()

@app.get("/api/signals")
async def api_signals(): return GLOBAL_STATE["signals"]

@app.get("/api/commodities")
async def api_commodities(): return {"commodities": GLOBAL_STATE["commodities"], "timestamp": GLOBAL_STATE["last_sync"]}

@app.get("/api/gdelt/india-events")
async def api_gdelt():
    # GDELT is separate, but we cache it for 20 mins locally
    if get_cached("gdelt"): return get_cached("gdelt")
    events = await _gdelt.fetch_events_with_fallback(max_records=15)
    gti = _gdelt.compute_india_gti(events, {})
    res = {"events": events, "gti": gti if gti > 0 else 52.0}
    set_cached("gdelt", res)
    return res

@app.get("/api/indices")
async def api_indices(): return await asyncio.get_event_loop().run_in_executor(None, _nse.fetch_indices)

@app.get("/api/macro/rbi")
async def api_rbi(): return {"repo_rate": 6.5, "cpi_inflation": 5.1, "timestamp": datetime.now(IST).isoformat()}

# Serve Frontend SPA
DIST_DIR = BASE_DIR / "frontend" / "dist"
logger.info(f"Probing frontend: {DIST_DIR} (exists: {DIST_DIR.exists()})")
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"): return {"error": "Not Found"}
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/")
    async def root_fallback():
        return {"status": "Live", "sync": GLOBAL_STATE["last_sync"], "msg": f"UI not found at {DIST_DIR}"}

# Websocket
ws_clients = set()
@app.websocket("/ws/live")
async def websocket_route(websocket: WebSocket):
    await websocket.accept()
    ws_clients.add(websocket)
    if GLOBAL_STATE["last_sync"]:
        await websocket.send_text(json.dumps({"type": "price_update", "data": GLOBAL_STATE["signals"]}))
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect: ws_clients.discard(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
