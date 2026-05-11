"""
backtester.py
Generates historical signal data (Bias Score) for the last 30-90 days.
Uses historical yfinance data to reconstruct signal engine inputs.
"""

import os
import json
import logging
import datetime
import yfinance as yf
from .signal_engine import compute_signal

logger = logging.getLogger(__name__)

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "../data/signals_history.json")

def generate_historical_backfill(days=60):
    """
    Backfills signal history by downloading historical data and running it
    through the deterministic signal engine.
    """
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    
    tickers = {
        "nifty":   "^NSEI",
        "vix":     "^INDIAVIX",
        "brent":   "BZ=F",
        "usd_inr": "USDINR=X"
    }
    
    try:
        # Download historical data
        data = {}
        for key, sym in tickers.items():
            df = yf.download(sym, period=f"{days}d", interval="1d", progress=False)
            if not df.empty:
                data[key] = df['Close']

        # Get the common index (dates) where we have data for all
        common_dates = data["nifty"].index
        for key in data:
            common_dates = common_dates.intersection(data[key].index)
        
        history = []
        for date in common_dates:
            # Reconstruct inputs for that specific day
            # Note: We use daily close as proxy for the signal engine inputs
            nifty_price = data["nifty"].loc[date]
            # Calculate 1-day pct change (approximation)
            idx = data["nifty"].index.get_loc(date)
            nifty_pct = 0
            if idx > 0:
                prev_price = data["nifty"].iloc[idx-1]
                nifty_pct = (nifty_price - prev_price) / prev_price * 100

            inputs = {
                "nifty_pct":         float(nifty_pct),
                "vix":               float(data["vix"].loc[date]),
                "fii_net":           0.0, # Historical FII net is harder to get in batch, using neutral
                "fii_ratio":         1.0,
                "dii_net":           0.0,
                "brent":             float(data["brent"].loc[date]),
                "usd_inr":           float(data["usd_inr"].loc[date]),
                "irs":               50.0, # Neutral IRS
                "group_correlation": 0.5,
                "avg_danger_score":  50.0,
            }
            
            signal = compute_signal(inputs)
            history.append({
                "date":  date.strftime("%Y-%m-%d"),
                "score": signal["score"],
                "state": signal["state"],
            })

        # Save to file
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)
            
        return history
    except Exception as e:
        logger.error(f"Backfill generation failed: {e}")
        return []

def get_signal_history():
    """Returns signal history from file, generates if missing."""
    if not os.path.exists(HISTORY_FILE):
        return generate_historical_backfill()
    
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except:
        return generate_historical_backfill()
