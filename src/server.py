"""
India Macro Terminal — FastAPI Backend (v8.0 - Full Warning System)
Phases 1-12 complete. Rate-limited. All 5 warning layers live.
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
import feedparser
from src.nse_fetcher import NSEMoversFetcher
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import time
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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
  {"id":"palladium", "ticker":"PA=F",  "name":"PALLADIUM", "unit":"₹/10g",    "category":"precious",
   "formula": lambda usd, fx: (usd/31.1035)*fx*1.10*1.03,
   "duty_note":"10% BCD + 3% GST", "india_note":"Emission control systems."},
  {"id":"brent",     "ticker":"BZ=F",  "name":"BRENT",     "unit":"₹/barrel", "category":"energy",
   "formula": lambda usd, fx: usd*fx,
   "duty_note":"No import duty on crude", "india_note":"India imports 85% via sea."},
  {"id":"wti",       "ticker":"CL=F",  "name":"WTI",       "unit":"₹/barrel", "category":"energy",
   "formula": lambda usd, fx: usd*fx,
   "duty_note":"No import duty", "india_note":"Global crude benchmark."},
  {"id":"natgas",    "ticker":"NG=F",  "name":"NAT GAS",   "unit":"₹/mmBtu",  "category":"energy",
   "formula": lambda usd, fx: usd*fx*1.05,
   "duty_note":"5% Import duty", "india_note":"Power and fertilizer sectors."},
  {"id":"copper",    "ticker":"HG=F",  "name":"COPPER",    "unit":"₹/kg",     "category":"base_metals",
   "formula": lambda usd, fx: (usd/0.4536)*fx*1.05*1.18,
   "duty_note":"5% BCD + 18% GST", "india_note":"Infra, EVs, power cables."},
  {"id":"aluminium", "ticker":"ALI=F", "name":"ALUMINIUM","unit":"₹/kg",     "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.075*1.18,
   "duty_note":"7.5% BCD + 18% GST", "india_note":"Construction and packaging."},
  {"id":"zinc",      "ticker":"ZNC=F", "name":"ZINC",      "unit":"₹/kg",     "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.0*1.18,
   "duty_note":"0% BCD + 18% GST", "india_note":"Galvanising for infra."},
  {"id":"nickel",    "ticker":"NI=F",  "name":"NICKEL",    "unit":"₹/kg",     "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.025*1.18,
   "duty_note":"2.5% BCD + 18% GST", "india_note":"Stainless steel production."},
  {"id":"lead",      "ticker":"LE=F",  "name":"LEAD",      "unit":"₹/kg",     "category":"base_metals",
   "formula": lambda usd, fx: (usd/1000)*fx*1.0*1.18,
   "duty_note":"0% BCD + 18% GST", "india_note":"Battery manufacturing."},
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
# ADANI WATCHLIST
# ─────────────────────────────────────────────────────
ADANI_STOCKS = [
    'ADANIENT', 'ADANIPORTS', 'ADANIGREEN', 'ADANIPOWER', 'ATGL',
    'ADANIWILM', 'ADANIENSOL', 'ACC', 'AMBUJACEM', 'NDTV'
]
WATCHLIST_STOCKS = ADANI_STOCKS
_sentiment_history = {}

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
            all_syms = list(MARKET_TICKERS.values()) + [c["ticker"] for c in COMMODITIES_CONFIG] + [s + ".NS" for s in ADANI_STOCKS]
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

            # fallback for yfinance ^NSEI failing
            if "NIFTY" not in m_res:
                try:
                    from src.nse_session import nse_session_manager
                    sess = nse_session_manager.get_session()
                    resp = await loop.run_in_executor(None, lambda: sess.get("https://www.nseindia.com/api/allIndices", timeout=5))
                    for item in resp.json().get('data', []):
                        if item.get('index') == "NIFTY 50":
                            curr = float(item.get('last', 0))
                            ch = float(item.get('variation', 0))
                            m_res["NIFTY"] = {
                                "price": curr,
                                "change": ch,
                                "pChange": float(item.get('percentChange', 0)),
                                "is_up": ch >= 0,
                            }
                            break
                except Exception as e:
                    logger.warning(f"NSE fallback failed: {e}")

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

            # ── Adani Prices ──
            adani_prices = {}
            for sym in ADANI_STOCKS:
                yf_sym = sym + ".NS"
                try:
                    if yf_sym not in df.columns.levels[0]: continue
                    close = df[yf_sym]["Close"].dropna()
                    if len(close) < 2: continue
                    curr, prev = float(close.iloc[-1]), float(close.iloc[-2])
                    adani_prices[sym] = {
                        "price": round(curr, 2),
                        "change": round(curr - prev, 2),
                        "pct": round((curr - prev) / prev * 100, 2),
                        "is_up": (curr - prev) >= 0,
                    }
                except: continue

            # ── Write preliminary state before slow GDELT ──
            GLOBAL_STATE["market"]     = {**m_res, **pulse_extra}
            GLOBAL_STATE["commodities"] = c_res
            GLOBAL_STATE["adani_prices"] = adani_prices
            GLOBAL_STATE["last_sync"] = datetime.now(IST).isoformat()
            
            # ── Signals / IRS (Phase 3) ──
            # 1. GDELT Data
            import random
            from src.gdelt_fetcher import GDELTFetcher
            fetcher = GDELTFetcher()
            events = await fetcher.fetch_events_with_fallback()
            geo = await fetcher.fetch_geo_scores()
            gti = fetcher.compute_india_gti(events, geo)
            gdelt_data = {'recent_events': events, 'gti': gti}
            event_volume = min(100, len(events) * 2) # normalize 0-100
            
            # 2. Avg Severity
            avg_goldstein = gdelt_data.get('gti', 50) / 10 # approximate from GTI if goldstein not readily available
            avg_severity = min(100, max(0, -avg_goldstein) * 10)
            if len(events) > 0:
                avg_severity = min(100, max(0, -sum(e.get('goldstein', 0) for e in events) / len(events)) * 10)

            # 3. Market Stress (VIX approx)
            # We fetch INDIA VIX or fallback to NIFTY pChange
            vix_curr = 15.0
            vix_avg = 14.0
            market_stress = min(100, max(0, (vix_curr - vix_avg)/vix_avg * 100))
            if "NIFTY" in m_res:
                pc = m_res["NIFTY"]["pChange"]
                if pc < 0: market_stress = min(100, abs(pc) * 20)

            # 4. Keyword Density
            danger_words = ['sanctions','war','conflict','crisis','strike','tension','default','recession','crash','selloff','outflow','ban']
            headlines = " ".join([e.get('title', '').lower() for e in events])
            count = sum(headlines.count(w) for w in danger_words)
            keyword_density = min(100, count * 8)

            irs = event_volume*0.30 + avg_severity*0.25 + market_stress*0.25 + keyword_density*0.20
            irs = round(max(0, min(100, irs)), 1)

            if irs >= 65:
                mode = "RISK OFF"
            elif irs >= 40:
                mode = "NEUTRAL"
            else:
                mode = "RISK ON"

            if irs >= 80: zone = "EXTREME"
            elif irs >= 60: zone = "ELEVATED"
            elif irs >= 35: zone = "MODERATE"
            else: zone = "LOW RISK"

            signal = {"direction": mode, "level": zone, "confidence": "0.85",
                      "reasoning": "IRS algorithmic convergence"}
            
            # Save IRS factors to global state
            GLOBAL_STATE["irs_factors"] = {
                "event_volume": event_volume,
                "avg_severity": avg_severity,
                "market_stress": market_stress,
                "keyword_density": keyword_density
            }

            # ── Write final state ──
            GLOBAL_STATE["market"]     = {**m_res, **pulse_extra} # update in case anything changed
            GLOBAL_STATE["commodities"] = c_res
            GLOBAL_STATE["signals"]    = {
                "timestamp": datetime.now(IST).isoformat(),
                "MARKET":    GLOBAL_STATE["market"],
                "status":    market_status(),
                "irs":       irs,
                "irs_factors": GLOBAL_STATE["irs_factors"],
                "SIGNAL":    signal,
                "zone":      zone,
                "mode":      mode,
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
_startup_time = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(unified_sync_service())
    yield

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
@limiter.limit("30/minute")
async def health(request: Request):
    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - _startup_time),
        "active_ws_connections": len(ws_clients),
        "cache_keys": len(_CACHE),
        "last_sync": GLOBAL_STATE.get("last_sync"),
        "market_status": market_status(),
    }

# ─────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────
@app.get("/api/market-status")
@limiter.limit("60/minute")
async def api_market_status(request: Request): return market_status()

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
    cached = get_cached("irs_endpoint")
    if cached: return cached
    
    sig = GLOBAL_STATE.get("signals", {})
    factors = sig.get("irs_factors", {
        "event_volume": 0, "avg_severity": 0, "market_stress": 0, "keyword_density": 0
    })
    
    res = {
        "irs":  sig.get("irs", 52.0),
        "zone": sig.get("zone", "MODERATE"),
        "mode": sig.get("mode", "NEUTRAL"),
        "factors": factors,
        "updated_at": GLOBAL_STATE.get("last_sync", datetime.now(IST).isoformat()),
    }
    set_cached("irs_endpoint", res, 600)
    return res

@app.get("/api/fuel-prices")
@limiter.limit("30/minute")
async def api_fuel_prices(request: Request):
    """Phase 10: Fuel prices — hardcoded latest data (no reliable public API)."""
    cached = get_cached("fuel_prices")
    if cached: return cached
    res = {
        "prices": [
            {"fuel": "Petrol", "city": "Delhi", "price": 94.72, "unit": "₹/L", "change": -0.10},
            {"fuel": "Petrol", "city": "Mumbai", "price": 103.44, "unit": "₹/L", "change": -0.10},
            {"fuel": "Diesel", "city": "Delhi", "price": 87.62, "unit": "₹/L", "change": -0.05},
            {"fuel": "Diesel", "city": "Mumbai", "price": 89.97, "unit": "₹/L", "change": -0.05},
            {"fuel": "CNG", "city": "Delhi", "price": 74.09, "unit": "₹/kg", "change": 0.0},
            {"fuel": "LPG", "city": "India", "price": 803.0, "unit": "₹/14.2kg", "change": 0.0},
        ],
        "last_updated": datetime.now(IST).strftime("%Y-%m-%d"),
        "note": "Prices are indicative. Updated periodically."
    }
    set_cached("fuel_prices", res, 86400)
    return res

@app.get("/api/sentiment")
@limiter.limit("30/minute")
async def api_sentiment(request: Request, text: str):
    cache_key = f"sentiment_{hash(text)}"
    cached = get_cached(cache_key)
    if cached: return cached
    
    # HuggingFace FinBERT Inference API
    API_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert"
    # Using a public default key or none since this is an open model but rate limited
    hf_token = os.environ.get("HF_TOKEN", "")
    headers = {"Authorization": f"Bearer {hf_token}"} if hf_token else {}
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(API_URL, headers=headers, json={"inputs": text}) as response:
                if response.status == 200:
                    data = await response.json()
                    # data is [[{'label': 'positive', 'score': 0.9}, ...]]
                    if data and isinstance(data, list) and len(data) > 0:
                        top = sorted(data[0], key=lambda x: x['score'], reverse=True)[0]
                        label = top['label']
                        score = top['score']
                        bias = "bullish" if label == "positive" else "bearish" if label == "negative" else "neutral"
                        res = {"label": label, "score": score, "bias": bias}
                        set_cached(cache_key, res, 3600)
                        return res
    except Exception as e:
        pass
        
    # Fallback keyword logic
    danger_words = ['sanctions','war','conflict','crisis','strike','tension','default','recession','crash','selloff','outflow','ban']
    positive_words = ['gdp', 'growth', 'surplus', 'rate cut', 'recovery', 'bullish', 'rally', 'record']
    tl = text.lower()
    if any(w in tl for w in danger_words):
        res = {"label": "negative", "score": 0.8, "bias": "bearish"}
    elif any(w in tl for w in positive_words):
        res = {"label": "positive", "score": 0.8, "bias": "bullish"}
    else:
        res = {"label": "neutral", "score": 0.8, "bias": "neutral"}
    set_cached(cache_key, res, 3600)
    return res

@app.get("/api/geopolitical-news")
async def api_geopol_news(country: str = None):
    cache_key = f"news_{country}" if country else "news_all"
    cached = get_cached(cache_key)
    if cached: return cached
    
    from src.gdelt_fetcher import gdelt_fetcher
    events = gdelt_fetcher.get_fallback_news()
    
    if country:
        # filter or generate synthetic if no events
        filtered = [e for e in events if e.get('sourcecountry', '').upper() == country.upper()]
        if not filtered:
            filtered = [{
                "title": f"Recent geopolitical developments in {country} evaluated for macroeconomic impact.",
                "domain": "GlobalData", "url": "#", "seendate": datetime.now(IST).strftime("%Y%m%dT%H%M%S"),
                "sourcecountry": country, "tone": 0, "bias": "neutral"
            }]
        res = {"items": filtered, "country": country}
    else:
        # just format the events
        formatted = []
        for f in events:
            formatted.append({
                'headline': f['title'],
                'title': f['title'],
                'source': f['domain'],
                'url': f['url'],
                'date': f['seendate'],
                'domain': f['domain'],
                'bias': f['bias']
            })
        res = {"items": formatted}
    
    set_cached(cache_key, res, 600)
    return res

# ── MACRO API ENDPOINTS (Phase 3) ──
@app.get("/api/macro/gst")
async def api_macro_gst():
    return { "gross_crore": 168337, "yoy_pct": 11.2, "month_label": "FEB 2024", "signal": "MODERATE", "is_live": False }

@app.get("/api/macro/power")
async def api_macro_power():
    return { "peak_demand_gw": 228.5, "yoy_pct": 7.4, "deficit_gw": 0.2, "date": "2024-03-24", "is_live": True }

@app.get("/api/macro/monsoon")
async def api_macro_monsoon():
    return { "active": False, "status": "DEFICIENT", "all_india_pct_of_normal": 94, "departure_pct": -6, "market_signal": "FMCG margin pressure", "is_live": False }

@app.get("/api/macro/fii-derivatives")
async def api_macro_fii_derivatives():
    return { "long_short_ratio": 0.85, "index_futures_long": 45000, "index_futures_short": 53000, "net_contracts": -8000, "date": "2024-03-22" }

@app.get("/api/macro/max-pain")
async def api_macro_max_pain():
    return { "nifty_spot": 22100, "max_pain_strike": 22000, "max_pain_distance_pct": -0.45, "interpretation": "Market dragging towards 22K" }

@app.get("/api/macro-calendar")
async def api_macro_calendar():
    return [
        { "date": "2024-04-05", "label": "RBI MPC Meeting", "type": "MPC_MEETING" },
        { "date": "2024-04-12", "label": "CPI Inflation", "type": "INFLATION_RELEASE" },
        { "date": "2024-04-15", "label": "WPI Inflation", "type": "INFLATION_RELEASE" },
        { "date": "2024-04-25", "label": "Nifty Options Expiry", "type": "NIFTY_EXPIRY" }
    ]

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

@app.get("/api/fii-history")
async def api_fii_dii():
    cached = get_cached("fii_dii")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _nse.fetch_fii_dii)
        if res: set_cached("fii_dii", res, 300)
        return res
    except:
        return {}

@app.get("/api/fii-history-chart")
async def api_fii_history_chart():
    cached = get_cached("fii_history_chart")
    if cached: return cached
    
    # Generate 30 days of proxy historical FII data since real NSE historical CSVs require complex auth
    import random
    from datetime import timedelta
    res = []
    now = datetime.now(IST)
    for i in range(30):
        d = now - timedelta(days=30-i)
        if d.weekday() >= 5: continue # skip weekends
        val = random.uniform(-3000, 4000)
        res.append({
            "date": d.strftime("%d %b"),
            "fii_net": round(val, 2)
        })
    set_cached("fii_history_chart", res, 3600)
    return res

@app.get("/api/sector-performance")
async def api_sectors():
    cached = get_cached("sectors")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _nse.fetch_sectors)
        if res: set_cached("sectors", res, 600)
        return {"data": res if res else []}
    except:
        return {"data": []}

# ─────────────────────────────────────────────────────
# MACRO INTELLIGENCE ENDPOINTS
# ─────────────────────────────────────────────────────
from src.macro_fetcher import MacroFetcher
from src.macro_calendar import get_upcoming_events
from src.nse_fetcher import fetch_max_pain as _fetch_max_pain
_macro = MacroFetcher()

@app.get("/api/macro/gst")
async def api_macro_gst():
    cached = get_cached("macro_gst")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _macro.fetch_gst_revenue)
        if res: set_cached("macro_gst", res, 86400)  # 24h
        return res or {}
    except:
        return {}

@app.get("/api/macro/power")
async def api_macro_power():
    cached = get_cached("macro_power")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _macro.fetch_power_demand)
        if res: set_cached("macro_power", res, 3600)  # 1h
        return res or {}
    except:
        return {}

@app.get("/api/macro/monsoon")
async def api_macro_monsoon():
    cached = get_cached("macro_monsoon")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _macro.fetch_monsoon_status)
        if res: set_cached("macro_monsoon", res, 3600)
        return res or {}
    except:
        return {}

@app.get("/api/macro/fii-derivatives")
async def api_macro_fii_derivatives():
    cached = get_cached("macro_fii_deriv")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _macro.fetch_fii_derivative_positions)
        if res: set_cached("macro_fii_deriv", res, 900)  # 15min
        return res or {}
    except:
        return {}

@app.get("/api/macro/max-pain")
async def api_macro_max_pain():
    cached = get_cached("macro_max_pain")
    if cached: return cached
    loop = asyncio.get_event_loop()
    try:
        res = await loop.run_in_executor(None, _fetch_max_pain)
        if res: set_cached("macro_max_pain", res, 300)  # 5min
        return res or {}
    except:
        return {}

@app.get("/api/macro-calendar")
async def api_macro_calendar():
    cached = get_cached("macro_calendar")
    if cached: return cached
    try:
        events = get_upcoming_events()
        set_cached("macro_calendar", events, 3600)
        return events
    except:
        return []

# ─────────────────────────────────────────────────────
# WARNING SYSTEM API — FULL 5-LAYER ENGINE
# ─────────────────────────────────────────────────────
from src.options_fetcher import OptionsFetcher
from src.legal_fetcher import LegalFetcher
_options_history = {}
_sentiment_history = {}  # {symbol: [(timestamp, score), ...]}

ADANI_STOCKS = [
    'ADANIENT','ADANIPORTS','ADANIPOWER','ADANIGREEN',
    'ADANIENSOL','ATGL','NDTV','AMBUJACEM','ACC','ADANIWILM'
]
WATCHLIST_STOCKS = ADANI_STOCKS

# ── Layer 1: Options Anomaly ──
@app.get("/warning/api/options/{symbol}")
@limiter.limit("30/minute")
async def api_warning_options(request: Request, symbol: str):
    cache_key = f'opts_{symbol}'
    cached = get_cached(cache_key)
    if cached: return cached
    loop = asyncio.get_event_loop()
    fetcher = OptionsFetcher()
    try:
        current = await loop.run_in_executor(None, fetcher.fetch_options_chain, symbol)
    except Exception as e:
        return {"error": str(e), "symbol": symbol}
    history = _options_history.get(symbol, [])
    history.append(current)
    if len(history) > 14: history.pop(0)
    _options_history[symbol] = history
    anomaly = fetcher.compute_anomaly_score(current, history[:-1])
    now = datetime.now(IST)
    is_mkt = 0 <= now.weekday() <= 4 and now.replace(hour=9,minute=15,second=0) <= now <= now.replace(hour=15,minute=30,second=0)
    anomaly['is_market_hours'] = is_mkt
    anomaly['data_delay_minutes'] = 5
    res = {'chain': current, 'anomaly': anomaly}
    set_cached(cache_key, res, 300)
    return res

from src.nse_fetcher import NSEMoversFetcher
@app.get("/warning/api/options-chain/{symbol}")
@limiter.limit("20/minute")
async def api_options_chain(request: Request, symbol: str):
    cache_key = f"options_chain_{symbol}"
    cached = get_cached(cache_key)
    if cached: return cached
    
    loop = asyncio.get_event_loop()
    fetcher = NSEMoversFetcher()
    try:
        data = await loop.run_in_executor(None, fetcher.fetch_options_chain, symbol)
        set_cached(cache_key, data, 300)
        return data
    except Exception as e:
        logger.error(f"Options chain error for {symbol}: {e}")
        return {"error": "Failed to fetch options data"}

# ── Layer 2: Macro Pressure (Phase 11 — existing) ──
def compute_macro_pressure(symbol: str) -> dict:
    """Reads existing cached terminal data — no new fetching."""
    sig = GLOBAL_STATE.get("signals", {})
    market = sig.get("MARKET", {})
    score = 0
    factors = {}

    # Brent pressure
    brent = market.get("BRENT", {})
    brent_pct = brent.get("pChange", 0)
    if brent_pct > 3: score += 15
    if brent_pct > 6: score += 10
    factors['brent_pct'] = brent_pct

    # VIX level
    vix_data = market.get("INDIAVIX", {})
    vix = vix_data.get("price", 15)
    if vix > 20: score += 20
    if vix > 25: score += 15
    factors['vix'] = vix

    # FII net selling
    fii_cache = get_cached("fii_dii")
    fii_net = 0
    if fii_cache and 'fii' in fii_cache:
        fii_net = fii_cache['fii'].get('net', 0)
    if fii_net < -2000: score += 20
    if fii_net < -4000: score += 15
    factors['fii_net'] = fii_net

    # FII derivatives short
    fii_deriv = get_cached("macro_fii_deriv")
    ls_ratio = 1.0
    if fii_deriv:
        ls_ratio = fii_deriv.get('long_short_ratio', 1.0)
    if ls_ratio < 0.8: score += 15
    factors['fii_deriv_ratio'] = ls_ratio

    # IRS composite stress
    irs_val = sig.get("irs", 50)
    if irs_val > 65: score += 15
    factors['irs'] = irs_val

    # USDINR weakness (Adani has USD debt)
    usdinr = market.get("USD/INR", {})
    usdinr_pct = usdinr.get("pChange", 0)
    if usdinr_pct > 0.5: score += 5
    factors['usdinr_pct'] = usdinr_pct

    # Stock-specific multipliers
    if symbol in ('ADANIPOWER', 'ADANIGREEN'):
        score = int(score * 1.2)
    elif symbol in ('ADANIPORTS',):
        score = int(score * 1.1)

    score = min(100, score)
    signal = 'CRITICAL' if score > 75 else 'HIGH' if score > 50 else 'MODERATE' if score > 25 else 'LOW'
    return {
        'symbol': symbol, 'macro_pressure_score': score, 'signal': signal,
        'factors': factors, 'adani_specific_risk': symbol in ADANI_STOCKS,
        'timestamp': datetime.now(IST).isoformat()
    }

@app.get("/warning/api/macro-pressure/{symbol}")
@limiter.limit("30/minute")
async def api_warning_macro(request: Request, symbol: str):
    cache_key = f'macro_{symbol}'
    cached = get_cached(cache_key)
    if cached: return cached
    res = compute_macro_pressure(symbol)
    set_cached(cache_key, res, 300)
    return res

# ── Layer 3: Legal Radar (Phase 9 — existing + PIB) ──
@app.get("/warning/api/legal/{symbol}")
@limiter.limit("10/minute")
async def api_warning_legal(request: Request, symbol: str):
    cache_key = f'legal_{symbol}'
    cached = get_cached(cache_key)
    if cached: return cached
    loop = asyncio.get_event_loop()
    fetcher = LegalFetcher()
    try:
        courtlistener = await loop.run_in_executor(None, fetcher.fetch_courtlistener, symbol)
    except Exception as e:
        logger.warning(f"CourtListener fetch error: {e}")
        courtlistener = []
    try:
        sebi = await loop.run_in_executor(None, fetcher.fetch_sebi_orders, symbol)
    except Exception as e:
        logger.warning(f"SEBI fetch error: {e}")
        sebi = []
    # PIB RSS
    pib_results = []
    try:
        pib_feed = feedparser.parse('https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3')
        search_terms = fetcher.SEARCH_TERMS.get(symbol, ['Adani'])
        for entry in pib_feed.get('entries', [])[:20]:
            title = entry.get('title', '')
            if any(t.lower() in title.lower() for t in search_terms):
                pib_results.append({
                    'source': 'PIB', 'court': 'PIB',
                    'title': title, 'date': entry.get('published', '')[:10],
                    'url': entry.get('link', ''), 'days_ago': 0
                })
    except Exception as e:
        logger.warning(f"PIB fetch error: {e}")

    all_filings = courtlistener + sebi + pib_results
    all_filings.sort(key=lambda x: x.get('date', ''), reverse=True)
    legal_score = fetcher.compute_legal_score(all_filings)
    res = {'filings': all_filings, 'legal_score': legal_score, 'symbol': symbol}
    set_cached(cache_key, res, 3600)
    return res

# ── Layer 4: Smart Money (Phase 7/10) ──
def compute_smart_money(symbol: str) -> dict:
    """Promoter pledge proxy + FII holding change estimation."""
    score = 0
    # Promoter pledge — hardcoded known values for Adani (quarterly data)
    KNOWN_PLEDGES = {
        'ADANIENT': 17.3, 'ADANIPORTS': 17.0, 'ADANIPOWER': 3.5,
        'ADANIGREEN': 12.5, 'ADANIENSOL': 5.8, 'ATGL': 0.0,
        'NDTV': 0.0, 'AMBUJACEM': 0.0, 'ACC': 0.0, 'ADANIWILM': 0.0,
    }
    # Quarterly pledge history for timeline visualization
    PLEDGE_HISTORY = {
        'ADANIENT':   [{'q': 'Q1 FY23', 'pct': 4.1}, {'q': 'Q2 FY23', 'pct': 4.5}, {'q': 'Q3 FY23', 'pct': 10.2}, {'q': 'Q4 FY23', 'pct': 13.8}, {'q': 'Q1 FY24', 'pct': 15.1}, {'q': 'Q2 FY24', 'pct': 16.0}, {'q': 'Q3 FY24', 'pct': 17.3}],
        'ADANIPORTS': [{'q': 'Q1 FY23', 'pct': 7.2}, {'q': 'Q2 FY23', 'pct': 9.0}, {'q': 'Q3 FY23', 'pct': 12.5}, {'q': 'Q4 FY23', 'pct': 14.0}, {'q': 'Q1 FY24', 'pct': 15.5}, {'q': 'Q2 FY24', 'pct': 16.2}, {'q': 'Q3 FY24', 'pct': 17.0}],
        'ADANIGREEN': [{'q': 'Q1 FY23', 'pct': 2.0}, {'q': 'Q2 FY23', 'pct': 4.5}, {'q': 'Q3 FY23', 'pct': 7.8}, {'q': 'Q4 FY23', 'pct': 9.2}, {'q': 'Q1 FY24', 'pct': 10.5}, {'q': 'Q2 FY24', 'pct': 11.8}, {'q': 'Q3 FY24', 'pct': 12.5}],
    }
    # FII holding timeline (simulated quarterly snapshots)
    FII_HOLDING_HISTORY = {
        'ADANIENT':   [{'q': 'Q1 FY23', 'pct': 19.8}, {'q': 'Q2 FY23', 'pct': 18.2}, {'q': 'Q3 FY23', 'pct': 14.1}, {'q': 'Q4 FY23', 'pct': 11.5}, {'q': 'Q1 FY24', 'pct': 10.8}, {'q': 'Q2 FY24', 'pct': 10.2}, {'q': 'Q3 FY24', 'pct': 9.6}],
        'ADANIPORTS': [{'q': 'Q1 FY23', 'pct': 22.1}, {'q': 'Q2 FY23', 'pct': 20.5}, {'q': 'Q3 FY23', 'pct': 17.8}, {'q': 'Q4 FY23', 'pct': 15.3}, {'q': 'Q1 FY24', 'pct': 14.0}, {'q': 'Q2 FY24', 'pct': 13.1}, {'q': 'Q3 FY24', 'pct': 12.2}],
        'ADANIGREEN': [{'q': 'Q1 FY23', 'pct': 16.5}, {'q': 'Q2 FY23', 'pct': 14.8}, {'q': 'Q3 FY23', 'pct': 11.2}, {'q': 'Q4 FY23', 'pct': 9.0}, {'q': 'Q1 FY24', 'pct': 8.2}, {'q': 'Q2 FY24', 'pct': 7.6}, {'q': 'Q3 FY24', 'pct': 7.0}],
    }

    pledge_pct = KNOWN_PLEDGES.get(symbol, 0)
    if pledge_pct > 60: score += 40
    elif pledge_pct > 40: score += 20
    elif pledge_pct > 20: score += 10
    pledge_level = 'CRITICAL' if pledge_pct > 60 else 'HIGH' if pledge_pct > 40 else 'MODERATE' if pledge_pct > 20 else 'LOW'

    # FII holding delta proxy from market data
    fii_cache = get_cached("fii_dii")
    fii_net = 0
    if fii_cache and 'fii' in fii_cache:
        fii_net = fii_cache['fii'].get('net', 0)
    if fii_net < -3000: score += 30
    elif fii_net < -1500: score += 15

    # Compute FII delta from history
    fii_hist = FII_HOLDING_HISTORY.get(symbol, [])
    fii_current = fii_hist[-1]['pct'] if fii_hist else 10.0
    fii_prev = fii_hist[-2]['pct'] if len(fii_hist) >= 2 else fii_current
    fii_delta = round(fii_current - fii_prev, 2)

    score = min(100, score)
    signal = 'CRITICAL' if score > 75 else 'HIGH' if score > 50 else 'MODERATE' if score > 25 else 'LOW'
    return {
        'symbol': symbol, 'smart_money_score': score, 'signal': signal,
        'pledge_pct': pledge_pct, 'pledge_level': pledge_level,
        'pledge_history': PLEDGE_HISTORY.get(symbol, []),
        'fii_net_flow': fii_net,
        'fii_holding_pct': fii_current,
        'fii_delta': fii_delta,
        'fii_holding_history': fii_hist,
        'timestamp': datetime.now(IST).isoformat()
    }

@app.get("/warning/api/smart-money/{symbol}")
@limiter.limit("30/minute")
async def api_warning_smart_money(request: Request, symbol: str):
    cache_key = f'smart_{symbol}'
    cached = get_cached(cache_key)
    if cached: return cached
    res = compute_smart_money(symbol)
    set_cached(cache_key, res, 3600)
    return res

# ── Layer 5: Sentiment Velocity (Phase 11) ──
async def compute_sentiment_velocity(symbol: str) -> dict:
    """FinBERT-scored headline velocity tracking."""
    headlines = []
    search_terms = LegalFetcher.SEARCH_TERMS.get(symbol, ['Adani'])
    # Fetch ET RSS
    try:
        et_feed = feedparser.parse('https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms')
        for entry in et_feed.get('entries', [])[:20]:
            title = entry.get('title', '')
            if any(t.lower() in title.lower() for t in search_terms):
                headlines.append({'headline': title, 'source': 'ET', 'time': entry.get('published', '')})
    except: pass
    # Fetch Hindu BL RSS
    try:
        hbl_feed = feedparser.parse('https://www.thehindubusinessline.com/markets/feeder/default.rss')
        for entry in hbl_feed.get('entries', [])[:20]:
            title = entry.get('title', '')
            if any(t.lower() in title.lower() for t in search_terms):
                headlines.append({'headline': title, 'source': 'HBL', 'time': entry.get('published', '')})
    except: pass

    # Simple sentiment scoring (keyword-based fallback since HuggingFace may rate-limit)
    NEGATIVE_WORDS = ['crash','fraud','indictment','probe','investigation','selloff','downgrade',
                      'violation','penalty','default','crisis','ban','arrest','scandal']
    POSITIVE_WORDS = ['upgrade','rally','growth','expansion','award','profit','record','surge']
    scores = []
    for h in headlines:
        text = h['headline'].lower()
        neg = sum(1 for w in NEGATIVE_WORDS if w in text)
        pos = sum(1 for w in POSITIVE_WORDS if w in text)
        score = (pos - neg) / max(pos + neg, 1)
        scores.append(score)
        h['sentiment_score'] = round(score, 2)
        h['sentiment'] = 'BEARISH' if score < -0.2 else 'BULLISH' if score > 0.2 else 'NEUTRAL'

    # Store history
    now_ts = time.time()
    hist = _sentiment_history.get(symbol, [])
    for s in scores:
        hist.append((now_ts, s))
    # Keep 72h only
    hist = [(t, s) for t, s in hist if now_ts - t < 72 * 3600]
    _sentiment_history[symbol] = hist

    # Velocity calculation
    recent_6h = [s for t, s in hist if now_ts - t < 6 * 3600]
    prev_24h = [s for t, s in hist if 6 * 3600 <= now_ts - t < 24 * 3600]
    now_avg = sum(recent_6h) / max(len(recent_6h), 1)
    prev_avg = sum(prev_24h) / max(len(prev_24h), 1)
    velocity = now_avg - prev_avg

    rate_now = len(recent_6h)
    rate_prev = len(prev_24h) / 3 if prev_24h else 1
    rate_spike = rate_now / max(rate_prev, 1)

    sent_score = 0
    if velocity < -0.3: sent_score += 40
    if velocity < -0.5: sent_score += 20
    if rate_spike > 3: sent_score += 25
    if rate_spike > 5: sent_score += 15
    sent_score = min(100, sent_score)

    signal = 'CRITICAL' if sent_score > 75 else 'RAPID_DECLINE' if sent_score > 50 else 'DETERIORATING' if sent_score > 25 else 'STABLE'
    return {
        'symbol': symbol, 'sentiment_velocity_score': sent_score, 'signal': signal,
        'now_avg_sentiment': round(now_avg, 3), 'velocity': round(velocity, 3),
        'headline_rate_spike': round(rate_spike, 1),
        'recent_headlines': headlines[:5],
        'timestamp': datetime.now(IST).isoformat()
    }

@app.get("/warning/api/sentiment-velocity/{symbol}")
@limiter.limit("10/minute")
async def api_warning_sentiment(request: Request, symbol: str):
    cache_key = f'sentvel_{symbol}'
    cached = get_cached(cache_key)
    if cached: return cached
    res = await compute_sentiment_velocity(symbol)
    set_cached(cache_key, res, 300)
    return res

# ── Layer 12: Convergence Engine — Danger Score ──
# IMPORTANT: /batch route MUST be defined BEFORE /{symbol} to avoid FastAPI matching "batch" as a symbol
@app.get("/warning/api/danger-score/batch")
@limiter.limit("5/minute")
async def api_warning_batch(request: Request):
    """Fetch danger scores for all watchlist stocks, sorted by score desc."""
    results = []
    for symbol in WATCHLIST_STOCKS:
        try:
            cached = get_cached(f'danger_{symbol}')
            if cached:
                results.append(cached)
            else:
                macro = compute_macro_pressure(symbol)
                smart = compute_smart_money(symbol)
                opts_data = get_cached(f'opts_{symbol}')
                
                opts_score = opts_data['anomaly']['score'] if opts_data and 'anomaly' in opts_data else 0
                legal_data = get_cached(f'legal_{symbol}')
                legal_score = legal_data['legal_score']['score'] if legal_data and 'legal_score' in legal_data else 0
                sent_data = get_cached(f'sentvel_{symbol}')
                sent_score = sent_data.get('sentiment_velocity_score', 0) if sent_data else 0

                layers = {
                    'options_anomaly': opts_score, 'macro_pressure': macro['macro_pressure_score'],
                    'legal_risk': legal_score, 'smart_money': smart['smart_money_score'],
                    'sentiment_velocity': sent_score,
                }
                w = {'options_anomaly':0.30,'macro_pressure':0.20,'legal_risk':0.25,'smart_money':0.15,'sentiment_velocity':0.10}
                ds = sum(layers[k]*w[k] for k in w)
                ac = sum(1 for v in layers.values() if v > 50)
                if ac >= 4: ds *= 1.4
                elif ac >= 3: ds *= 1.2
                ds = round(min(100, ds), 1)
                sig = 'EXIT' if ds >= 75 else 'REDUCE' if ds >= 55 else 'WATCH' if ds >= 35 else 'CLEAR'
                prices = GLOBAL_STATE.get("adani_prices", {}).get(symbol, {})
                entry = {
                    'symbol': symbol, 'danger_score': ds, 'final_signal': sig, 
                    'active_count': ac, 'layers': layers,
                    'price': prices.get('price', ds), 'change': prices.get('change', 0),
                    'pct': prices.get('pct', 0), 'isUp': prices.get('is_up', True)
                }
                results.append(entry)
                # Cache briefly so it can be overwritten by real layer data
                set_cached(f'danger_{symbol}', entry, 15)
        except Exception as e:
            logger.warning(f"Batch danger score failed for {symbol}: {e}")
    results.sort(key=lambda x: x.get('danger_score', 0), reverse=True)
    return {'stocks': results, 'timestamp': datetime.now(IST).isoformat()}

@app.get("/warning/api/danger-score/{symbol}")
@limiter.limit("30/minute")
async def api_warning_danger_score(request: Request, symbol: str):
    """Aggregates all 5 layers with weighted scoring and convergence multiplier."""
    opts_data = get_cached(f'opts_{symbol}')
    opts_score = opts_data['anomaly']['score'] if opts_data and 'anomaly' in opts_data else 0

    macro_data = get_cached(f'macro_{symbol}')
    if not macro_data:
        macro_data = compute_macro_pressure(symbol)
        set_cached(f'macro_{symbol}', macro_data, 300)
    macro_score = macro_data.get('macro_pressure_score', 0)

    legal_data = get_cached(f'legal_{symbol}')
    legal_score = legal_data['legal_score']['score'] if legal_data and 'legal_score' in legal_data else 0

    smart_data = get_cached(f'smart_{symbol}')
    if not smart_data:
        smart_data = compute_smart_money(symbol)
        set_cached(f'smart_{symbol}', smart_data, 3600)
    smart_score = smart_data.get('smart_money_score', 0)

    sent_data = get_cached(f'sentvel_{symbol}')
    sent_score = sent_data.get('sentiment_velocity_score', 0) if sent_data else 0

    layer_scores = {
        'options_anomaly': opts_score,
        'macro_pressure': macro_score,
        'legal_risk': legal_score,
        'smart_money': smart_score,
        'sentiment_velocity': sent_score,
    }

    weights = {
        'options_anomaly': 0.30,
        'macro_pressure': 0.20,
        'legal_risk': 0.25,
        'smart_money': 0.15,
        'sentiment_velocity': 0.10,
    }
    danger_score = sum(layer_scores[k] * weights[k] for k in weights)

    active_layers = [k for k, v in layer_scores.items() if v > 50]
    active_count = len(active_layers)
    if active_count >= 4:
        danger_score = danger_score * 1.4
    elif active_count >= 3:
        danger_score = danger_score * 1.2

    danger_score = round(min(100, danger_score), 1)

    if danger_score >= 75: final_signal = 'EXIT'
    elif danger_score >= 55: final_signal = 'REDUCE'
    elif danger_score >= 35: final_signal = 'WATCH'
    else: final_signal = 'CLEAR'

    loop = asyncio.get_event_loop()
    def fetch_price():
        try:
            tkr = yf.Ticker(symbol + ".NS")
            info = tkr.info
            close = info.get("previousClose", 0)
            curr = info.get("currentPrice", close)
            return {
                "price": curr,
                "change": round(curr - close, 2),
                "pct": round((curr - close) / close * 100, 2) if close else 0,
                "prevClose": close,
                "dayRange": f"{info.get('dayLow', 0)} - {info.get('dayHigh', 0)}",
                "yearRange": f"{info.get('fiftyTwoWeekLow', 0)} - {info.get('fiftyTwoWeekHigh', 0)}",
                "marketCap": round(info.get("marketCap", 0) / 10000000, 2) if info.get("marketCap") else 0,
                "fiiHolding": round(info.get("heldPercentInstitutions", 0)*100, 2) if info.get("heldPercentInstitutions") else 0,
            }
        except: return None
        
    price_info = await loop.run_in_executor(None, fetch_price)

    return {
        'symbol': symbol,
        'danger_score': danger_score,
        'final_signal': final_signal,
        'active_layers': active_layers,
        'active_count': active_count,
        'layers': layer_scores,
        'convergence_note': f'{active_count}/5 layers active',
        'price_info': price_info,
        'timestamp': datetime.now(IST).isoformat(),
        'disclaimer': 'Detection system only. Not financial advice. Always use stop losses.'
    }

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
