"""
India Macro Terminal — FastAPI Backend (v7.1 - Render Stable)
Singleton sync with correct field shapes for all frontend components.
"""

import json
import os
import sys
import logging
import asyncio
from datetime import datetime
from pathlib import Path

import yfinance as yf
import pytz
from src.nse_fetcher import NSEMoversFetcher
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import time
from contextlib import asynccontextmanager

# ─────────────────────────────────────────────────────
# PATH & LOGGING
# ─────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
IST = pytz.timezone('Asia/Kolkata')

# ─────────────────────────────────────────────────────
# CONFIGS — full set matching frontend expectations
# ─────────────────────────────────────────────────────
COMMODITIES_CONFIG = [
  {"id":"gold",      "ticker":"GC=F",  "name":"GOLD",      "unit":"₹/10g",    "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*10*fx*1.06*1.03,
   "duty_note":"6% BCD + 3% GST", "india_note":"India imports 800–900T/year."},
  {"id":"silver",    "ticker":"SI=F",  "name":"SILVER",    "unit":"₹/kg",     "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*1000*fx*1.06*1.03,
   "duty_note":"6% BCD + 3% GST", "india_note":"Solar, EV, jewellery demand."},
  {"id":"platinum",  "ticker":"PL=F",  "name":"PLATINUM",  "unit":"₹/10g",    "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*fx*1.10*1.03,
   "duty_note":"10% BCD + 3% GST", "india_note":"Auto catalytic converters."},
  {"id":"brent",     "ticker":"BZ=F",  "name":"BRENT",     "unit":"₹/barrel", "category":"energy",
   "formula": lambda usd, fx: usd*fx,
   "duty_note":"No import duty on crude", "india_note":"India imports 85% via sea."},
  {"id":"copper",    "ticker":"HG=F",  "name":"COPPER",    "unit":"₹/kg",     "category":"base_metals",
   "formula": lambda usd, fx: (usd/0.4536)*fx*1.05*1.18,
   "duty_note":"5% BCD + 18% GST", "india_note":"Infra, EVs, power cables."},
  {"id":"zinc",      "ticker":"ZNC=F", "name":"ZINC",      "unit":"₹/kg",     "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.0*1.18,
   "duty_note":"0% BCD + 18% GST", "india_note":"Galvanising for infra."},
]

MARKET_TICKERS = {
    "NIFTY":     "^NSEI",
    "SENSEX":    "^BSESN",
    "BANKNIFTY": "^NSEBANK",
    "USD/INR":   "USDINR=X",
    "INDIAVIX":  "^INDIAVIX",
}

# ─────────────────────────────────────────────────────
# CACHE
# ─────────────────────────────────────────────────────
_CACHE = {}
_CACHE_EXPR = {}
def get_cached(key):
    if key in _CACHE and time.time() < _CACHE_EXPR.get(key, 0):
        return _CACHE[key]
    return None

def set_cached(key, val, ttl=300):
    _CACHE[key] = val
    _CACHE_EXPR[key] = time.time() + ttl

_nse = NSEMoversFetcher()

# ─────────────────────────────────────────────────────
# GLOBAL STATE
# ─────────────────────────────────────────────────────
GLOBAL_STATE = {
    "market": {},
    "commodities": [],
    "signals": {},
    "last_sync": None,
}
ws_clients = set()

def market_status():
    now = datetime.now(IST)
    if now.weekday() >= 5:
        return {"status": "WEEKEND", "is_open": False, "color": "grey", "next_event": "Mon 9:15 AM"}
    m_open  = now.replace(hour=9,  minute=15, second=0, microsecond=0)
    m_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    if m_open <= now <= m_close:
        rem = int((m_close - now).total_seconds() / 60)
        return {"status": f"OPEN ({rem}m rem)", "is_open": True, "color": "green", "next_event": "3:30 PM"}
    return {"status": "CLOSED", "is_open": False, "color": "grey", "next_event": "9:15 AM"}

# ─────────────────────────────────────────────────────
# SINGLETON SYNC — one yfinance batch every 10 minutes
# ─────────────────────────────────────────────────────
async def unified_sync_service():
    await asyncio.sleep(5)          # let uvicorn claim port before first fetch
    while True:
        try:
            logger.info("Syncing macro data (batch)…")
            all_syms = list(MARKET_TICKERS.values()) + [c["ticker"] for c in COMMODITIES_CONFIG]
            loop = asyncio.get_event_loop()
            df = await loop.run_in_executor(
                None,
                lambda: yf.download(all_syms, period="5d", group_by="ticker", progress=False)
            )

            # ── FX ──
            fx = 83.5
            if "USDINR=X" in df.columns.levels[0]:
                s = df["USDINR=X"]["Close"].dropna()
                if not s.empty: fx = float(s.iloc[-1])

            # ── Market indices ──
            m_res = {}
            for name, sym in MARKET_TICKERS.items():
                try:
                    if sym not in df.columns.levels[0]: continue
                    close = df[sym]["Close"].dropna()
                    if len(close) < 2: continue
                    curr, prev = float(close.iloc[-1]), float(close.iloc[-2])
                    ch = curr - prev
                    m_res[name] = {
                        "price":   round(curr, 2),
                        "change":  round(ch,   2),
                        "pChange": round(ch / prev * 100, 2),
                        "is_up":   ch >= 0,
                    }
                except Exception: continue

            # ── Commodities ──
            c_res = []
            pulse_extra = {}
            for c in COMMODITIES_CONFIG:
                try:
                    sym   = c["ticker"]
                    if sym not in df.columns.levels[0]: continue
                    close = df[sym]["Close"].dropna()
                    if len(close) < 2: continue
                    curr, prev = float(close.iloc[-1]), float(close.iloc[-2])

                    inr_curr = round(c["formula"](curr, fx), 2)
                    inr_prev = round(c["formula"](prev, fx), 2)
                    inr_ch   = inr_curr - inr_prev
                    pct      = round((curr - prev) / prev * 100, 2)
                    spark    = [round(c["formula"](float(v), fx), 2) for v in close.tail(7).values]

                    item = {
                        "id":         c["id"],
                        "name":       c["name"],
                        "inr_price":  inr_curr,
                        "inr_change": round(inr_ch, 2),
                        "pct_change": pct,
                        "direction":  "up" if inr_ch >= 0 else "down",
                        "sparkline":  spark,
                        "category":   c["category"],
                        "unit":       c["unit"],
                        "usd_price":  round(curr, 2),
                        "duty_note":  c["duty_note"],
                        "india_note": c["india_note"],
                        "rsi14":      52.0,
                        "rsi_label":  "NEUTRAL",
                    }
                    c_res.append(item)

                    # Pulse dashboard also expects Gold/Silver/Copper in MARKET key
                    if c["id"].upper() in ("GOLD", "SILVER", "COPPER"):
                        pulse_extra[c["id"].upper()] = {
                            "price":   inr_curr,
                            "change":  round(inr_ch, 2),
                            "pChange": pct,
                            "direction": item["direction"],
                            "is_up":   inr_ch >= 0,
                        }
                except Exception: continue

            # ── BRENT for Pulse ──
            for item in c_res:
                if item["id"] == "brent":
                    m_res["BRENT"] = {
                        "price":   item["inr_price"],
                        "change":  item["inr_change"],
                        "pChange": item["pct_change"],
                        "is_up":   item["inr_change"] >= 0,
                    }

            # ── Signals / IRS ──
            irs = 52.0
            signal = {"direction": "NEUTRAL", "level": "MODERATE", "confidence": "0.85",
                      "reasoning": "Standard macro equilibrium"}
            if "NIFTY" in m_res:
                pc = m_res["NIFTY"]["pChange"]
                if pc < -1.5:
                    irs, signal = 68.0, {"direction": "HEDGED / SHORT", "level": "HIGH",
                                         "confidence": "0.90", "reasoning": "Market stress detected"}
                elif pc > 1.5:
                    irs, signal = 32.0, {"direction": "LONG / AGGRESSIVE", "level": "LOW",
                                         "confidence": "0.88", "reasoning": "Strong bullish trend"}

            # ── Write state ──
            GLOBAL_STATE["market"]     = {**m_res, **pulse_extra}
            GLOBAL_STATE["commodities"] = c_res
            GLOBAL_STATE["signals"]    = {
                "timestamp": datetime.now(IST).isoformat(),
                "MARKET":    GLOBAL_STATE["market"],
                "status":    market_status(),
                "irs":       irs,
                "SIGNAL":    signal,
            }
            GLOBAL_STATE["last_sync"] = datetime.now(IST).isoformat()

            # ── Broadcast ──
            msg = json.dumps({"type": "price_update", "data": GLOBAL_STATE["signals"]})
            for ws in list(ws_clients):
                try:   await ws.send_text(msg)
                except: ws_clients.discard(ws)

            logger.info("Sync complete.")
        except Exception as e:
            logger.error(f"Sync failed: {e}")

        await asyncio.sleep(600)     # 10-minute interval

# ─────────────────────────────────────────────────────
# LIFESPAN & APP
# ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(unified_sync_service())
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────
@app.get("/api/market-status")
async def api_market_status(): return market_status()

@app.get("/api/signals")
async def api_signals(): return GLOBAL_STATE["signals"]

@app.get("/api/commodities")
async def api_commodities():
    return {"commodities": GLOBAL_STATE["commodities"], "timestamp": GLOBAL_STATE["last_sync"]}

@app.get("/api/indices")
async def api_indices():
    return {"data": [
        {"symbol": k, **v} for k, v in GLOBAL_STATE["market"].items()
        if k in MARKET_TICKERS
    ]}

@app.get("/api/india-risk-score")
async def api_irs():
    sig = GLOBAL_STATE["signals"]
    return {
        "irs":  sig.get("irs", 52.0),
        "zone": "ELEVATED" if sig.get("irs", 52) >= 60 else "MODERATE",
        "updated_at": GLOBAL_STATE["last_sync"],
    }

@app.get("/api/market/movers")
async def api_market_movers():
    cached = get_cached("movers")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _nse.fetch)
        if res: set_cached("movers", res, 300)
        return res
    except:
        return {}

@app.get("/api/index-sparklines")
async def api_sparklines():
    cached = get_cached("sparklines")
    if cached: return cached
    loop = asyncio.get_event_loop()
    def _fetch():
        tickers = {"NIFTY 50": "^NSEI", "SENSEX": "^BSESN", "BANKNIFTY": "^NSEBANK"}
        result = {}
        for name, sym in tickers.items():
            try:
                h = yf.Ticker(sym).history(period="5d", interval="1h")
                if not h.empty:
                    result[name] = [{"close": round(float(v), 2)} for v in h['Close'].dropna().tolist()[-24:]]
            except:
                pass
        return result
    res = await loop.run_in_executor(None, _fetch)
    set_cached("sparklines", res, 1800) # cache for 30 mins to avoid yf limits
    return res

# ── Frontend SPA ──
DIST_DIR = BASE_DIR / "frontend" / "dist"
logger.info(f"Frontend dist: {DIST_DIR} (exists={DIST_DIR.exists()})")
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("ws"):
            return {"error": "404"}
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/")
    async def root():
        return {"status": "API Only — frontend not built", "path": str(DIST_DIR)}

# ── WebSocket ──
@app.websocket("/ws/live")
async def ws_route(websocket: WebSocket):
    await websocket.accept()
    ws_clients.add(websocket)
    if GLOBAL_STATE["last_sync"]:
        await websocket.send_text(
            json.dumps({"type": "price_update", "data": GLOBAL_STATE["signals"]})
        )
    try:
        while True: await websocket.receive_text()
    except: ws_clients.discard(websocket)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"Starting on port {port}")
    uvicorn.run("src.server:app", host="0.0.0.0", port=port)
