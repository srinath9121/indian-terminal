"""
India Macro Terminal — Model Intelligence Layer (v1.0)
Blocks A-G from the Model Layer Document.
All model logic lives here. server.py imports and calls it.
"""

import logging
from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────
# BLOCK C — DATA VALIDATION
# ─────────────────────────────────────────────────────
# Last known good values — never show 0 on the dashboard
_LAST_GOOD = {
    'fx_rate': 84.0,
    'nifty': 24000.0,
    'vix': 14.0,
}

def validate_inputs(market_data: dict, fx_rate: float,
                    last_price_ts: datetime = None) -> dict:
    """Validate all incoming data per Block C rules.
    
    Guards:
      - USD/INR must be 79-92
      - Nifty must be 10000-35000
      - VIX must be 8-85
      - Price timestamp must be < 2 hours old
    
    Returns validated dict + data_quality: LIVE / STALE / BLOCKED.
    If BLOCKED, returns last cached values. Never passes bad data to model.
    """
    quality = 'LIVE'
    flags = []

    # FX Guard
    if not (80 <= fx_rate <= 90):
        flags.append(f"USD/INR rejected: {fx_rate}")
        quality = 'BLOCKED'
        fx_rate = _LAST_GOOD['fx_rate']
    else:
        _LAST_GOOD['fx_rate'] = fx_rate

    # Nifty Guard
    nifty = market_data.get('NIFTY', {}).get('price', 0)
    if nifty and not (10000 <= nifty <= 35000):
        flags.append(f"Nifty rejected: {nifty}")
        quality = 'BLOCKED'
    elif nifty:
        _LAST_GOOD['nifty'] = nifty

    # VIX Guard
    vix = market_data.get('INDIAVIX', {}).get('price', 0)
    if vix and not (8 <= vix <= 85):
        flags.append(f"VIX rejected: {vix}")
        quality = 'STALE'
    elif vix:
        _LAST_GOOD['vix'] = vix

    # Timestamp Staleness Guard
    if last_price_ts:
        age_minutes = (datetime.now(IST) - last_price_ts).total_seconds() / 60
        if age_minutes > 120:  # > 2 hours old
            flags.append(f"Price data stale: {age_minutes:.0f}min old")
            if quality == 'LIVE':
                quality = 'STALE'

    return {
        'fx_rate': fx_rate,
        'data_quality': quality,
        'validation_flags': flags,
        'last_good': _LAST_GOOD.copy(),
        'timestamp': datetime.now(IST).isoformat()
    }


# ─────────────────────────────────────────────────────
# BLOCK G — MACRO REGIME CLASSIFIER
# ─────────────────────────────────────────────────────
def classify_macro_regime(vix: float, nifty_5d_pct: float,
                          fii_net_10d_direction: str = 'NEUTRAL',
                          usd_inr_5d_pct: float = 0.0) -> dict:
    """Classify current macro regime. Returns label + code + multiplier."""
    if vix > 30 or nifty_5d_pct < -10:
        return {'label': 'CRISIS', 'code': 3, 'multiplier': 1.30}
    elif vix > 20 or nifty_5d_pct < -5 or (fii_net_10d_direction == 'SELL' and usd_inr_5d_pct > 2):
        return {'label': 'RISK-OFF', 'code': 2, 'multiplier': 1.15}
    elif vix < 15 and nifty_5d_pct > 0 and fii_net_10d_direction == 'BUY':
        return {'label': 'RISK-ON', 'code': 0, 'multiplier': 0.85}
    else:
        return {'label': 'TRANSITION', 'code': 1, 'multiplier': 1.00}


# ─────────────────────────────────────────────────────
# BLOCK A — 5-LAYER RULE ENGINE
# ─────────────────────────────────────────────────────
def _layer_options_proxy(df_stock) -> dict:
    """Layer 1: Options activity proxy via volume + price momentum."""
    try:
        closes = df_stock["Close"].dropna()
        volumes = df_stock["Volume"].dropna()
        if len(closes) < 5 or len(volumes) < 20:
            return {'score': 0, 'rule_triggered': 'Insufficient data', 'raw_input': ''}

        vol_ratio_5d = float(volumes.iloc[-1] / max(volumes.iloc[-5:].mean(), 1))
        vol_ratio_20d = float(volumes.iloc[-1] / max(volumes.iloc[-20:].mean(), 1))
        price_5d_pct = float((closes.iloc[-1] - closes.iloc[-5]) / closes.iloc[-5] * 100)

        score = 0
        rule = []
        if vol_ratio_20d > 4:
            score += 50
            rule.append(f"Volume {vol_ratio_20d:.1f}× 20d avg")
        elif vol_ratio_20d > 2.5:
            score += 30
            rule.append(f"Volume {vol_ratio_20d:.1f}× 20d avg")
        elif vol_ratio_5d > 2:
            score += 15
            rule.append(f"Volume {vol_ratio_5d:.1f}× 5d avg")

        if price_5d_pct < -8:
            score += 40
            rule.append(f"Price drop {price_5d_pct:.1f}% in 5d")
        elif price_5d_pct < -4:
            score += 20
            rule.append(f"Price drop {price_5d_pct:.1f}% in 5d")

        return {
            'score': min(score, 100),
            'rule_triggered': ' + '.join(rule) if rule else 'No trigger',
            'raw_input': f"vol_ratio_20d={vol_ratio_20d:.2f}, price_5d={price_5d_pct:.2f}%",
            'data_source': 'yfinance OHLCV'
        }
    except Exception as e:
        logger.warning(f"Options proxy layer failed: {e}")
        return {'score': 0, 'rule_triggered': f'Error: {e}', 'raw_input': ''}


def _layer_legal_risk(headlines: list, symbol: str) -> dict:
    """Layer 2: Legal risk from RSS headline keyword scanning."""
    LEGAL_KEYWORDS = ['sebi', 'sec', 'fraud', 'indictment', 'investigation',
                       'enforcement', 'penalty', 'violation', 'ban', 'doj',
                       'court', 'lawsuit', 'hindenburg', 'short seller', 'notice']
    stock_keywords = {
        'ADANIENT': ['adani enterprises', 'gautam adani', 'adani group'],
        'ADANIPORTS': ['adani ports', 'adani logistics'],
        'ADANIGREEN': ['adani green'],
    }
    company_terms = stock_keywords.get(symbol, ['adani'])

    score = 0
    matched = []
    for h in headlines:
        h_lower = h.lower()
        # Check if headline mentions the company
        is_relevant = any(term in h_lower for term in company_terms)
        if not is_relevant:
            continue
        for kw in LEGAL_KEYWORDS:
            if kw in h_lower:
                score += 25
                matched.append(f"Keyword '{kw}' in: {h[:60]}")
                break

    return {
        'score': min(score, 100),
        'rule_triggered': '; '.join(matched[:3]) if matched else 'No legal keywords',
        'raw_input': f"{len(headlines)} headlines scanned",
        'data_source': 'RSS feeds + GDELT'
    }


def _layer_macro_pressure(nifty_5d_pct: float, vix: float,
                           usd_inr_5d_pct: float, brent_pct: float) -> dict:
    """Layer 3: Macro pressure from VIX, Nifty, USD/INR, Brent."""
    score = 0
    rule = []

    if vix > 25:
        score += 30
        rule.append(f"VIX elevated: {vix:.1f}")
    elif vix > 18:
        score += 15
        rule.append(f"VIX rising: {vix:.1f}")

    if nifty_5d_pct < -5:
        score += 30
        rule.append(f"Nifty 5d: {nifty_5d_pct:+.1f}%")
    elif nifty_5d_pct < -2:
        score += 15
        rule.append(f"Nifty 5d: {nifty_5d_pct:+.1f}%")

    if usd_inr_5d_pct > 2:
        score += 20
        rule.append(f"INR weakening {usd_inr_5d_pct:+.1f}%")

    if brent_pct > 5:
        score += 20
        rule.append(f"Brent spike {brent_pct:+.1f}%")

    return {
        'score': min(score, 100),
        'rule_triggered': ' + '.join(rule) if rule else 'Macro calm',
        'raw_input': f"VIX={vix:.1f}, Nifty5d={nifty_5d_pct:+.1f}%, USDINR5d={usd_inr_5d_pct:+.1f}%",
        'data_source': 'yfinance macro indices'
    }


def _layer_smart_money(fii_net_cr: float = 0, insider_sell_30d: float = 0) -> dict:
    """Layer 4: Smart money — FII flows + insider selling."""
    score = 0
    rule = []

    if fii_net_cr < -5000:
        score += 40
        rule.append(f"Heavy FII selling: ₹{fii_net_cr:.0f}Cr")
    elif fii_net_cr < -2000:
        score += 20
        rule.append(f"FII outflow: ₹{fii_net_cr:.0f}Cr")

    if insider_sell_30d > 500:
        score += 30
        rule.append(f"Insider selling: ₹{insider_sell_30d:.0f}Cr in 30d")
    elif insider_sell_30d > 100:
        score += 15
        rule.append(f"Insider selling: ₹{insider_sell_30d:.0f}Cr in 30d")

    return {
        'score': min(score, 100),
        'rule_triggered': ' + '.join(rule) if rule else 'No smart money signal',
        'raw_input': f"FII_net={fii_net_cr:.0f}Cr, insider_sell={insider_sell_30d:.0f}Cr",
        'data_source': 'NSE FII/DII + Finnhub (when available)'
    }


def _layer_sentiment_velocity(gdelt_tone_avg: float = 0,
                                negative_ratio: float = 0,
                                keyword_density: int = 0) -> dict:
    """Layer 5: Sentiment velocity from GDELT tone + negative headline ratio."""
    score = 0
    rule = []

    if gdelt_tone_avg < -5:
        score += 30
        rule.append(f"GDELT tone very negative: {gdelt_tone_avg:.1f}")
    elif gdelt_tone_avg < -2:
        score += 15
        rule.append(f"GDELT tone negative: {gdelt_tone_avg:.1f}")

    if negative_ratio > 0.7:
        score += 30
        rule.append(f"Negative headline ratio: {negative_ratio:.0%}")
    elif negative_ratio > 0.5:
        score += 15
        rule.append(f"Negative headline ratio: {negative_ratio:.0%}")

    if keyword_density > 10:
        score += 30
        rule.append(f"Danger keyword density: {keyword_density}")
    elif keyword_density > 5:
        score += 15
        rule.append(f"Danger keyword density: {keyword_density}")

    return {
        'score': min(score, 100),
        'rule_triggered': ' + '.join(rule) if rule else 'Sentiment neutral',
        'raw_input': f"tone={gdelt_tone_avg:.1f}, neg_ratio={negative_ratio:.2f}, kw={keyword_density}",
        'data_source': 'GDELT 2.0 + RSS'
    }


def compute_layer_scores(symbol: str, df_stock, macro_ctx: dict) -> dict:
    """Master function: compute all 5 layer scores for a stock.
    
    Args:
        symbol: e.g. 'ADANIENT'
        df_stock: pandas DataFrame with OHLCV data
        macro_ctx: dict with keys: nifty_5d_pct, vix, usd_inr_5d_pct,
                   brent_pct, fii_net_cr, headlines, gdelt_tone_avg,
                   negative_ratio, keyword_density
    """
    layers = {
        'options_proxy': _layer_options_proxy(df_stock),
        'legal_risk': _layer_legal_risk(macro_ctx.get('headlines', []), symbol),
        'macro_pressure': _layer_macro_pressure(
            macro_ctx.get('nifty_5d_pct', 0),
            macro_ctx.get('vix', 14),
            macro_ctx.get('usd_inr_5d_pct', 0),
            macro_ctx.get('brent_pct', 0)
        ),
        'smart_money': _layer_smart_money(
            macro_ctx.get('fii_net_cr', 0),
            macro_ctx.get('insider_sell_30d', 0)
        ),
        'sentiment_velocity': _layer_sentiment_velocity(
            macro_ctx.get('gdelt_tone_avg', 0),
            macro_ctx.get('negative_ratio', 0),
            macro_ctx.get('keyword_density', 0)
        ),
    }
    return layers


# ─────────────────────────────────────────────────────
# BLOCK A+B — DECISION GENERATOR + WEIGHTED SCORE
# ─────────────────────────────────────────────────────
LAYER_WEIGHTS = {
    'options_proxy': 0.30,
    'legal_risk': 0.25,
    'macro_pressure': 0.20,
    'smart_money': 0.15,
    'sentiment_velocity': 0.10,
}

def compute_final_score(layers: dict, regime: dict) -> float:
    """Weighted sum of layer scores × regime multiplier."""
    raw = sum(layers[k]['score'] * LAYER_WEIGHTS[k] for k in LAYER_WEIGHTS)
    final = round(min(raw * regime['multiplier'], 100), 1)
    return max(final, 12.0) # Base danger level, never 0.


def generate_decision(score: float, regime: dict) -> dict:
    """Generate HOLD / REDUCE / EXIT decision with explanation."""
    if score >= 60:
        decision = 'EXIT'
        reason = f"Score {score} exceeds EXIT threshold (60). Regime: {regime['label']}."
    elif score >= 35:
        decision = 'REDUCE'
        reason = f"Score {score} in REDUCE band (35-60). Regime: {regime['label']}."
    else:
        decision = 'HOLD'
        reason = f"Score {score} below REDUCE threshold. Regime: {regime['label']}."

    return {'decision': decision, 'score': score, 'reason': reason, 'regime': regime['label']}


# ─────────────────────────────────────────────────────
# BLOCK B — CAUSAL CHAIN EXPLANATION
# ─────────────────────────────────────────────────────
def causal_chain_explain(layers: dict, decision: dict) -> str:
    """Generate human-readable causal chain string."""
    # Find the top 2 contributing layers
    sorted_layers = sorted(layers.items(), key=lambda x: x[1]['score'], reverse=True)
    top2 = sorted_layers[:2]

    parts = []
    for name, data in top2:
        if data['score'] > 0:
            label = name.upper().replace('_', ' ')
            parts.append(f"{label}: {data['score']} ({data['rule_triggered']})")

    if not parts:
        return f"All layers quiet. Decision: {decision['decision']}."

    chain = " → ".join(parts)
    return f"{chain}. Final score: {decision['score']}. Decision: {decision['decision']}."


# ─────────────────────────────────────────────────────
# BLOCK E — TRACEABILITY (TRACE DICT BUILDER)
# ─────────────────────────────────────────────────────
def build_trace(symbol: str, layers: dict, decision: dict,
                regime: dict, data_quality: str) -> dict:
    """Build full trace dict for every model output."""
    return {
        'symbol': symbol,
        'score': decision['score'],
        'timestamp': datetime.now(IST).isoformat(),
        'data_quality': data_quality,
        'layers': layers,
        'decision': decision['decision'],
        'decision_reason': decision['reason'],
        'macro_regime': regime['label'],
        'regime_multiplier': regime['multiplier'],
        'causal_chain': causal_chain_explain(layers, decision),
    }


# ─────────────────────────────────────────────────────
# BLOCK F — FEATURE EXTRACTOR (ML-Ready)
# ─────────────────────────────────────────────────────
def extract_features(symbol: str, df_stock, macro_ctx: dict) -> dict:
    """Extract 19-feature vector. Used by rule engine today, LightGBM tomorrow."""
    try:
        closes = df_stock["Close"].dropna()
        volumes = df_stock["Volume"].dropna()

        features = {
            'price_5d_pct_change': float((closes.iloc[-1] - closes.iloc[-5]) / closes.iloc[-5] * 100) if len(closes) >= 5 else 0,
            'price_10d_pct_change': float((closes.iloc[-1] - closes.iloc[-10]) / closes.iloc[-10] * 100) if len(closes) >= 10 else 0,
            'volume_ratio_5d': float(volumes.iloc[-1] / max(volumes.iloc[-5:].mean(), 1)) if len(volumes) >= 5 else 1,
            'volume_ratio_20d': float(volumes.iloc[-1] / max(volumes.iloc[-20:].mean(), 1)) if len(volumes) >= 20 else 1,
            'pct_from_52w_high': float((closes.iloc[-1] - closes.max()) / closes.max() * 100),
            'nifty_5d_pct': macro_ctx.get('nifty_5d_pct', 0),
            'vix_level': macro_ctx.get('vix', 14),
            'vix_5d_change': macro_ctx.get('vix_5d_change', 0),
            'usd_inr_5d_change': macro_ctx.get('usd_inr_5d_pct', 0),
            'rbi_event_in_3d': macro_ctx.get('rbi_event_in_3d', 0),
            'legal_keyword_count_7d': macro_ctx.get('keyword_density', 0),
            'sebi_keyword_7d': 1 if macro_ctx.get('sebi_mentioned', False) else 0,
            'insider_sell_30d_cr': macro_ctx.get('insider_sell_30d', 0),
            'insider_transactions_90d_count': macro_ctx.get('insider_tx_count', 0),
            'negative_article_ratio_7d': macro_ctx.get('negative_ratio', 0),
            'gdelt_tone_7d_avg': macro_ctx.get('gdelt_tone_avg', 0),
            'gdelt_tone_velocity_3d': macro_ctx.get('gdelt_tone_velocity', 0),
            'macro_regime_code': macro_ctx.get('regime_code', 1),
            'group_avg_score': macro_ctx.get('group_avg_score', 0),
        }
        return features
    except Exception as e:
        logger.warning(f"Feature extraction failed for {symbol}: {e}")
        return {k: 0 for k in ['price_5d_pct_change', 'price_10d_pct_change',
                                'volume_ratio_5d', 'volume_ratio_20d', 'pct_from_52w_high',
                                'nifty_5d_pct', 'vix_level', 'vix_5d_change',
                                'usd_inr_5d_change', 'rbi_event_in_3d',
                                'legal_keyword_count_7d', 'sebi_keyword_7d',
                                'insider_sell_30d_cr', 'insider_transactions_90d_count',
                                'negative_article_ratio_7d', 'gdelt_tone_7d_avg',
                                'gdelt_tone_velocity_3d', 'macro_regime_code',
                                'group_avg_score']}


# ─────────────────────────────────────────────────────
# MASTER PIPELINE — Run the full model for one stock
# ─────────────────────────────────────────────────────
def run_model_pipeline(symbol: str, df_stock, macro_ctx: dict) -> dict:
    """Run the complete model pipeline for a single stock.
    
    Returns:
        dict with: score, decision, regime, layers, trace, features
    """
    # Step 1: Classify regime
    regime = classify_macro_regime(
        vix=macro_ctx.get('vix', 14),
        nifty_5d_pct=macro_ctx.get('nifty_5d_pct', 0),
        fii_net_10d_direction=macro_ctx.get('fii_direction', 'NEUTRAL'),
        usd_inr_5d_pct=macro_ctx.get('usd_inr_5d_pct', 0)
    )

    # Step 2: Compute 5 layer scores
    layers = compute_layer_scores(symbol, df_stock, macro_ctx)

    # Step 3: Weighted score × regime multiplier
    final_score = compute_final_score(layers, regime)

    # Step 4: Generate decision
    decision = generate_decision(final_score, regime)

    # Step 5: Build trace
    trace = build_trace(symbol, layers, decision, regime,
                         macro_ctx.get('data_quality', 'LIVE'))

    # Step 6: Extract features (for future ML)
    features = extract_features(symbol, df_stock, macro_ctx)

    return {
        'symbol': symbol,
        'score': final_score,
        'decision': decision['decision'],
        'reason': decision['reason'],
        'regime': regime,
        'layers': {k: {'score': v['score'], 'trigger': v['rule_triggered']} for k, v in layers.items()},
        'causal_chain': trace['causal_chain'],
        'trace': trace,
        'features': features,
    }
