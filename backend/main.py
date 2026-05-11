"""
India Macro Terminal — Clean FastAPI Backend
Port: 8001 (parallel to the legacy server on 8080)

Endpoints:
  GET /api/macro     → macro indicators + IRS
  GET /api/market    → indices + FII/DII
  GET /api/adani     → Adani group stocks
  GET /api/signals   → computed signal state
  GET /api/alerts    → rule-based live alerts
  GET /health        → service health check
"""

import logging
from datetime import datetime, timezone

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import macro, market, adani, signals, alerts

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="India Macro Terminal API",
    description="Clean production-grade backend for India Macro Terminal",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Register routes under /api prefix ─────────────────────────────────────────
app.include_router(macro.router,   prefix="/api")
app.include_router(market.router,  prefix="/api")
app.include_router(adani.router,   prefix="/api")
app.include_router(signals.router, prefix="/api")
app.include_router(alerts.router,  prefix="/api")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "india-macro-terminal-api",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoints": ["/api/macro", "/api/market", "/api/adani", "/api/signals", "/api/alerts"],
    }


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8001, reload=True)
