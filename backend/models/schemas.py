from pydantic import BaseModel
from typing import List, Optional


# ── Shared primitives ──────────────────────────────────────────────────────────

class PricePoint(BaseModel):
    price: float
    change: float
    pct_change: float
    direction: str          # "up" | "down"


class FlowData(BaseModel):
    net_value: float
    trend: str              # "inflow" | "outflow"
    streak_days: Optional[int] = None


# ── Macro ──────────────────────────────────────────────────────────────────────

class MacroIndicator(BaseModel):
    label: str
    value: float
    unit: str
    status: str             # "Strong" | "Rising" | "Neutral" | "Weak"
    trend: str              # "up" | "down" | "flat"


class IrsScore(BaseModel):
    score: float            # 0–100 (higher = more risk)
    zone: str               # "LOW RISK" | "MODERATE" | "ELEVATED" | "EXTREME"
    mode: str               # "RISK ON" | "NEUTRAL" | "RISK OFF"


class MacroResponse(BaseModel):
    gdp: MacroIndicator
    inflation: MacroIndicator
    repo_rate: MacroIndicator
    liquidity: MacroIndicator
    brent_crude: PricePoint
    usd_inr: PricePoint
    irs: IrsScore
    regime: str             # "BULLISH" | "NEUTRAL" | "DEFENSIVE"
    data_quality: str       # "LIVE" | "STALE" | "MOCK"
    timestamp: str


# ── Market ─────────────────────────────────────────────────────────────────────

class IndexData(BaseModel):
    symbol: str
    price: float
    change: float
    pct_change: float
    direction: str


class MarketResponse(BaseModel):
    nifty: IndexData
    sensex: IndexData
    bank_nifty: IndexData
    vix: IndexData
    fii_flows: FlowData
    dii_flows: FlowData
    data_quality: str
    timestamp: str


# ── Adani ──────────────────────────────────────────────────────────────────────

class AdaniStock(BaseModel):
    symbol: str
    price: float
    change: float
    pct_change: float
    direction: str
    danger_score: float     # 0–100 from model engine
    decision: str           # "BUY" | "HOLD" | "EXIT"
    causal_chain: str


class AdaniResponse(BaseModel):
    stocks: List[AdaniStock]
    group_correlation: float
    timestamp: str


# ── Signals ────────────────────────────────────────────────────────────────────

class SignalOutput(BaseModel):
    state: str              # "BULLISH" | "NEUTRAL" | "DEFENSIVE"
    confidence: int         # 0–100
    score: float            # 0–1 normalised
    reasons: List[str]
    breakdown: dict         # {price, group, flow, macro} layer scores
    timestamp: str


# ── Alerts ─────────────────────────────────────────────────────────────────────

class Alert(BaseModel):
    id: str
    title: str
    description: str
    category: str           # "Macro" | "Market" | "Adani" | "Geo"
    priority: str           # "High" | "Medium" | "Low"
    timestamp: str


class AlertsResponse(BaseModel):
    alerts: List[Alert]
    total: int
    high_count: int
    medium_count: int
    low_count: int
