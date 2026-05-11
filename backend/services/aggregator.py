"""
aggregator.py
Single entry point that combines all data sources and computes signals.
Routes call aggregate() — they never call data_fetcher or signal_engine directly.
"""

import logging
from datetime import datetime, timezone

from .data_fetcher import fetch_indices, fetch_fii_dii, fetch_adani, fetch_macro_context, fetch_fii_derivatives
from .signal_engine import compute_signal

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _determine_data_quality(indices: dict) -> str:
    """LIVE if we have real index data, MOCK otherwise."""
    nifty = indices.get("nifty", {})
    return "LIVE" if nifty.get("price", 0) > 0 else "MOCK"


def _compute_irs(brent: float, vix: float, fii_net: float) -> dict:
    """
    Simple India Risk Score (IRS) 0–100.
    Higher = more risk. Drives the macro layer in signal engine.
    """
    oil_component  = min(100, max(0, (brent - 60) / 50 * 100))  # 0 at $60, 100 at $110
    vix_component  = min(100, max(0, (vix - 10) / 20 * 100))    # 0 at 10, 100 at 30
    flow_component = min(100, max(0, (-fii_net / 5000) * 100))  # outflow → higher risk

    score = round(oil_component * 0.35 + vix_component * 0.35 + flow_component * 0.30, 1)

    if score >= 65:
        zone, mode = "EXTREME", "RISK OFF"
    elif score >= 40:
        zone, mode = "ELEVATED", "NEUTRAL"
    else:
        zone, mode = "LOW RISK", "RISK ON"

    return {"score": score, "zone": zone, "mode": mode}


def _determine_regime(signal_score: float) -> str:
    if signal_score >= 0.62:
        return "BULLISH"
    elif signal_score <= 0.44:
        return "DEFENSIVE"
    return "NEUTRAL"


# ── Public aggregation functions ───────────────────────────────────────────────

def aggregate_market() -> dict:
    ts = _now_iso()
    indices = fetch_indices()
    flows   = fetch_fii_dii()
    quality = _determine_data_quality(indices)

    return {
        "nifty":      {**indices.get("nifty",      {}), "symbol": "NIFTY 50"},
        "sensex":     {**indices.get("sensex",     {}), "symbol": "SENSEX"},
        "bank_nifty": {**indices.get("bank_nifty", {}), "symbol": "BANKNIFTY"},
        "vix":        {**indices.get("vix",        {}), "symbol": "INDIAVIX"},
        "fii_flows":  flows.get("fii", {}),
        "dii_flows":  flows.get("dii", {}),
        "data_quality": quality,
        "timestamp":  ts,
    }


def aggregate_macro() -> dict:
    ts      = _now_iso()
    ctx     = fetch_macro_context()
    indices = fetch_indices()
    flows   = fetch_fii_dii()

    brent_price = ctx.get("brent_crude", {}).get("price", 80.0)
    vix_price   = indices.get("vix",     {}).get("price", 15.0)
    fii_net     = flows.get("fii",       {}).get("net_value", 0.0)

    irs     = _compute_irs(brent_price, vix_price, fii_net)
    indices_data = fetch_indices()

    return {
        "gdp":        ctx.get("gdp"),
        "inflation":  ctx.get("inflation"),
        "repo_rate":  ctx.get("repo_rate"),
        "liquidity":  ctx.get("liquidity"),
        "brent_crude":ctx.get("brent_crude"),
        "usd_inr":    ctx.get("usd_inr"),
        "irs":        irs,
        "regime":     _determine_regime(
            _compute_signal_score(indices_data, flows, brent_price, vix_price, irs["score"])
        ),
        "data_quality": _determine_data_quality(indices_data),
        "timestamp":  ts,
    }


def aggregate_adani() -> dict:
    ts     = _now_iso()
    stocks = fetch_adani()

    danger_scores   = [s.get("danger_score", 50) for s in stocks]
    avg_danger      = sum(danger_scores) / len(danger_scores) if danger_scores else 50.0
    # Simple correlation proxy: if all stocks move similarly, correlation is high
    directions = [s.get("direction", "up") for s in stocks]
    same_dir   = directions.count(directions[0]) if directions else 0
    correlation = round(same_dir / max(len(directions), 1), 2)

    return {
        "stocks":            stocks,
        "group_correlation": correlation,
        "avg_danger_score":  round(avg_danger, 1),
        "timestamp":         ts,
    }


def aggregate_signals() -> dict:
    ts      = _now_iso()
    indices = fetch_indices()
    flows   = fetch_fii_dii()
    adani   = aggregate_adani()
    macro   = fetch_macro_context()

    brent   = macro.get("brent_crude", {}).get("price",  80.0)
    usd_inr = macro.get("usd_inr",     {}).get("price",  83.0)
    vix     = indices.get("vix",       {}).get("price",  15.0)
    nifty   = indices.get("nifty",     {}).get("pct_change", 0.0)
    fii_net = flows.get("fii",         {}).get("net_value", 0.0)
    dii_net = flows.get("dii",         {}).get("net_value", 0.0)
    irs     = _compute_irs(brent, vix, fii_net)

    # Fetch FII Derivative Statistics (Production Hardening)
    fii_deriv = fetch_fii_derivatives()
    fii_ratio = 1.0
    if fii_deriv and len(fii_deriv) > 0:
        longs  = float(fii_deriv[0].get('longContracts', 0))
        shorts = float(fii_deriv[0].get('shortContracts', 0))
        if shorts > 0: fii_ratio = longs / shorts

    signal = compute_signal({
        "nifty_pct":         nifty,
        "vix":               vix,
        "fii_net":           fii_net,
        "fii_ratio":         fii_ratio, # New 'Smart Money' metric
        "dii_net":           dii_net,
        "brent":             brent,
        "usd_inr":           usd_inr,
        "irs":               irs["score"],
        "group_correlation": adani.get("group_correlation", 0.5),
        "avg_danger_score":  adani.get("avg_danger_score",  50.0),
    })

    return {**signal, "timestamp": ts}


def aggregate_alerts() -> dict:
    ts      = _now_iso()
    indices = fetch_indices()
    flows   = fetch_fii_dii()
    macro   = fetch_macro_context()

    alerts  = []

    # Rule-based alert generation
    brent   = macro.get("brent_crude", {}).get("price", 80.0)
    fii_net = flows.get("fii", {}).get("net_value", 0.0)
    vix     = indices.get("vix", {}).get("price", 14.0)
    nifty   = indices.get("nifty", {}).get("pct_change", 0.0)

    if brent > 90:
        alerts.append({"id": "OIL_HIGH", "title": "Crude Oil Above $90", "description": f"Brent at ${brent:.1f}/barrel — CAD widening risk", "category": "Macro",  "priority": "High",   "timestamp": ts})
    elif brent > 80:
        alerts.append({"id": "OIL_ELEV", "title": "Crude Oil Elevated",  "description": f"Brent at ${brent:.1f}/barrel — monitor import bill", "category": "Macro",  "priority": "Medium", "timestamp": ts})

    if fii_net < -2000:
        alerts.append({"id": "FII_SELL", "title": "Heavy FII Selling",   "description": f"Net FII outflow ₹{abs(fii_net):,.0f} Cr today", "category": "Market", "priority": "High",   "timestamp": ts})
    elif fii_net < 0:
        alerts.append({"id": "FII_MILD", "title": "FII Net Sellers",     "description": f"Net FII outflow ₹{abs(fii_net):,.0f} Cr today", "category": "Market", "priority": "Medium", "timestamp": ts})

    if vix > 18:
        alerts.append({"id": "VIX_HIGH", "title": "India VIX Elevated",  "description": f"VIX at {vix:.1f} — market volatility rising", "category": "Market", "priority": "High",   "timestamp": ts})

    if nifty < -1.5:
        alerts.append({"id": "NIFTY_DOWN","title": "Nifty Sharp Decline","description": f"Nifty down {nifty:.2f}% — broad sell-off detected", "category": "Market", "priority": "High",   "timestamp": ts})

    if not alerts:
        alerts.append({"id": "STABLE",  "title": "Market Conditions Stable","description": "No critical alerts at this time", "category": "Market", "priority": "Low", "timestamp": ts})

    high   = sum(1 for a in alerts if a["priority"] == "High")
    medium = sum(1 for a in alerts if a["priority"] == "Medium")
    low    = sum(1 for a in alerts if a["priority"] == "Low")

    return {"alerts": alerts, "total": len(alerts), "high_count": high, "medium_count": medium, "low_count": low}


# ── Internal helper ────────────────────────────────────────────────────────────

def _compute_signal_score(indices, flows, brent, vix, irs_score) -> float:
    from .signal_engine import compute_signal as _cs
    result = _cs({
        "nifty_pct":  indices.get("nifty", {}).get("pct_change", 0.0),
        "vix":        vix,
        "fii_net":    flows.get("fii", {}).get("net_value", 0.0),
        "dii_net":    flows.get("dii", {}).get("net_value", 0.0),
        "brent":      brent,
        "usd_inr":    indices.get("usd_inr", {}).get("price", 83.0),
        "irs":        irs_score,
        "group_correlation": 0.5,
        "avg_danger_score":  50.0,
    })
    return result["score"]
