"""
signal_engine.py
Pure deterministic scoring logic.
No random values. No side effects. No I/O.
Input: normalised market + macro metrics.
Output: {state, confidence, score, reasons, breakdown}
"""

from typing import List


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def _normalise(value: float, lo: float, hi: float) -> float:
    """Map [lo, hi] → [0, 1]."""
    if hi == lo:
        return 0.5
    return _clamp((value - lo) / (hi - lo))


# ── Layer scorers ──────────────────────────────────────────────────────────────

def _price_layer(nifty_pct: float, vix: float) -> float:
    """Positive Nifty momentum + low VIX = bullish."""
    momentum = _clamp(0.5 + nifty_pct * 0.08)        # ±5% daily → 0.1–0.9
    vol_risk = _clamp(_normalise(vix, 10, 30))         # VIX 10=safe, 30=extreme
    return _clamp(momentum * 0.6 + (1 - vol_risk) * 0.4)


def _flow_layer(fii_net: float, dii_net: float, fii_ratio: float = 1.0) -> float:
    """Combined institutional flow sentiment including cash and derivatives."""
    fii_cash_score  = _clamp(0.5 + fii_net / 10000)
    dii_cash_score  = _clamp(0.5 + dii_net / 10000)
    
    # Derivatives ratio: 1.0 is neutral, 1.5 is extremely bullish, 0.5 is extremely bearish
    fii_deriv_score = _clamp(_normalise(fii_ratio, 0.5, 1.5))
    
    cash_score = fii_cash_score * 0.65 + dii_cash_score * 0.35
    return _clamp(cash_score * 0.6 + fii_deriv_score * 0.4)


def _macro_layer(brent: float, usd_inr: float, irs: float) -> float:
    """Lower oil, lower USD/INR, lower IRS = bullish macro."""
    oil_risk  = _normalise(brent,  60, 110)           # $110 = max risk
    fx_risk   = _normalise(usd_inr, 80, 90)            # 90 = max pressure
    irs_risk  = _normalise(irs, 0, 100)
    composite_risk = oil_risk * 0.35 + fx_risk * 0.25 + irs_risk * 0.40
    return _clamp(1 - composite_risk)


def _group_layer(group_correlation: float, avg_danger_score: float) -> float:
    """Low correlation + low danger = bullish group dynamics."""
    corr_risk   = _clamp(group_correlation)
    danger_risk = _normalise(avg_danger_score, 0, 100)
    return _clamp(1 - (corr_risk * 0.5 + danger_risk * 0.5))


# ── Reason builder ─────────────────────────────────────────────────────────────

def _build_reasons(layers: dict, inputs: dict) -> List[str]:
    reasons = []
    if layers["price"] < 0.45:
        reasons.append("Price momentum weak — Nifty underperforming or VIX elevated")
    if layers["flow"] < 0.45:
        reasons.append(f"Institutional flows negative — FII net ₹{inputs.get('fii_net', 0):,.0f} Cr")
    if layers["macro"] < 0.45:
        reasons.append(f"Macro pressure — Brent ${inputs.get('brent', 0):.1f}, IRS {inputs.get('irs', 0):.0f}/100")
    if layers["group"] < 0.45:
        reasons.append("Adani group correlation elevated — systemic risk rising")
    if not reasons:
        reasons.append("All layers positive — conditions broadly supportive")
    return reasons


def _build_causal_chain(inputs: dict) -> List[str]:
    """Generates a dynamic causal chain based on the most critical input metrics."""
    brent   = inputs.get("brent", 80.0)
    vix     = inputs.get("vix", 15.0)
    fii_net = inputs.get("fii_net", 0.0)
    irs     = inputs.get("irs", 50.0)

    # Deterministic chain construction based on 'bottleneck' detection
    if brent > 85:
        return ["Oil ↑", "Import Bill ↑", "CAD Stress", "INR Pressure", "Debt Cost ↑", "Market ↓"]
    if irs > 60:
        return ["IRS Risk ↑", "Global Tension", "FII Exit", "Liquidity ↓", "Equity ↓", "Caution ↑"]
    if fii_net < -3000:
        return ["FII Selloff", "Smart Money Exit", "Floor Broken", "Retail Panic", "Vol ↑", "Market ↓"]
    if vix > 20:
        return ["Volatility ↑", "Risk Appetite ↓", "Premium Decay", "Hedging ↑", "Market Stale"]
    
    # Default 'Bullish' or 'Stable' chain
    return ["Macro Stable", "Inflation ↓", "RBI Pause", "FII Inflow", "Growth ↑", "Market ↑"]


# ── Public API ─────────────────────────────────────────────────────────────────

def compute_signal(inputs: dict) -> dict:
    """
    inputs = {
        nifty_pct:        float,   # 1-day % change
        vix:              float,   # India VIX level
        fii_net:          float,   # Net FII flow ₹ Cr
        dii_net:          float,   # Net DII flow ₹ Cr
        brent:            float,   # Brent crude USD/barrel
        usd_inr:          float,   # USD/INR rate
        irs:              float,   # India Risk Score 0–100
        group_correlation:float,   # Adani group avg correlation 0–1
        avg_danger_score: float,   # Avg model danger score 0–100
    }
    """
    layers = {
        "price": _price_layer(
            nifty_pct=inputs.get("nifty_pct", 0.0),
            vix=inputs.get("vix", 15.0),
        ),
        "flow": _flow_layer(
            fii_net=inputs.get("fii_net", 0.0),
            dii_net=inputs.get("dii_net", 0.0),
            fii_ratio=inputs.get("fii_ratio", 1.0),
        ),
        "macro": _macro_layer(
            brent=inputs.get("brent", 80.0),
            usd_inr=inputs.get("usd_inr", 83.0),
            irs=inputs.get("irs", 50.0),
        ),
        "group": _group_layer(
            group_correlation=inputs.get("group_correlation", 0.5),
            avg_danger_score=inputs.get("avg_danger_score", 50.0),
        ),
    }

    # Weighted composite score (0–1)
    score = _clamp(
        layers["price"]  * 0.30 +
        layers["flow"]   * 0.25 +
        layers["macro"]  * 0.25 +
        layers["group"]  * 0.20
    )

    # State classification
    if score >= 0.62:
        state = "BULLISH"
    elif score <= 0.44:
        state = "DEFENSIVE"
    else:
        state = "NEUTRAL"

    return {
        "state":      state,
        "confidence": round(score * 100),
        "score":      round(score, 3),
        "reasons":    _build_reasons(layers, inputs),
        "causal_chain": _build_causal_chain(inputs),
        "breakdown":  {k: round(v, 3) for k, v in layers.items()},
    }
