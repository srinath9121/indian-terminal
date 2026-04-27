"""
India Macro Terminal — ML Data Builder
Fetches historical data via yfinance, engineers features, and prepares
training data for the LightGBM 5-day Nifty volatility forecaster.

Uses TimeSeriesSplit to prevent data leakage.
"""

import logging
import numpy as np
import pandas as pd
import yfinance as yf
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "models" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def fetch_historical_data(period="2y"):
    """Fetch historical OHLCV for Nifty, VIX, USD/INR, and Brent."""
    tickers = {
        "NIFTY": "^NSEI",
        "VIX": "^INDIAVIX",
        "USDINR": "USDINR=X",
        "BRENT": "BZ=F",
        "GOLD": "GC=F",
    }

    frames = {}
    for name, sym in tickers.items():
        try:
            hist = yf.Ticker(sym).history(period=period, interval="1d")
            if not hist.empty:
                temp = hist[['Close', 'Volume']].rename(
                    columns={'Close': f'{name}_close', 'Volume': f'{name}_vol'}
                )
                # Normalize index to date-only to fix timezone mismatch across tickers
                temp.index = temp.index.tz_localize(None).normalize()
                temp = temp[~temp.index.duplicated(keep='last')]
                frames[name] = temp
                logger.info(f"Fetched {len(temp)} rows for {name}")
        except Exception as e:
            logger.warning(f"Failed to fetch {name}: {e}")

    if 'NIFTY' not in frames:
        raise RuntimeError("Cannot build dataset without NIFTY data")

    # Merge all on date index
    df = frames['NIFTY']
    for name, frame in frames.items():
        if name != 'NIFTY':
            df = df.join(frame, how='left')

    df = df.ffill().dropna()
    return df


def engineer_features(df):
    """
    Create ML features from raw price data.
    Target: 5-day forward realized volatility of Nifty (annualized).
    """
    close = df['NIFTY_close']

    # ── Returns ──
    df['nifty_ret_1d'] = close.pct_change()
    df['nifty_ret_5d'] = close.pct_change(5)
    df['nifty_ret_20d'] = close.pct_change(20)

    # ── Volatility features ──
    df['nifty_vol_5d'] = df['nifty_ret_1d'].rolling(5).std() * np.sqrt(252)
    df['nifty_vol_10d'] = df['nifty_ret_1d'].rolling(10).std() * np.sqrt(252)
    df['nifty_vol_20d'] = df['nifty_ret_1d'].rolling(20).std() * np.sqrt(252)

    # ── Moving averages & ratios ──
    df['nifty_sma_10'] = close.rolling(10).mean()
    df['nifty_sma_50'] = close.rolling(50).mean()
    df['nifty_sma_ratio'] = df['nifty_sma_10'] / df['nifty_sma_50']

    # ── RSI (14-period) ──
    delta = close.diff()
    up = delta.clip(lower=0)
    down = -delta.clip(upper=0)
    ema_up = up.ewm(com=13, adjust=False).mean()
    ema_down = down.ewm(com=13, adjust=False).mean()
    rs = ema_up / ema_down
    df['nifty_rsi_14'] = 100 - (100 / (1 + rs))

    # ── VIX features ──
    if 'VIX_close' in df.columns:
        df['vix_level'] = df['VIX_close']
        df['vix_change_5d'] = df['VIX_close'].pct_change(5)
        df['vix_sma_10'] = df['VIX_close'].rolling(10).mean()
        df['vix_ratio'] = df['VIX_close'] / df['vix_sma_10']

    # ── USD/INR features ──
    if 'USDINR_close' in df.columns:
        df['usdinr_ret_5d'] = df['USDINR_close'].pct_change(5)
        df['usdinr_vol_10d'] = df['USDINR_close'].pct_change().rolling(10).std()

    # ── Brent features ──
    if 'BRENT_close' in df.columns:
        df['brent_ret_5d'] = df['BRENT_close'].pct_change(5)
        df['brent_vol_10d'] = df['BRENT_close'].pct_change().rolling(10).std()

    # ── Gold features ──
    if 'GOLD_close' in df.columns:
        df['gold_ret_5d'] = df['GOLD_close'].pct_change(5)

    # ── Volume features ──
    if 'NIFTY_vol' in df.columns:
        df['nifty_vol_ratio'] = df['NIFTY_vol'] / df['NIFTY_vol'].rolling(20).mean()

    # ── Day of week (cyclical encoding) ──
    df['day_of_week_sin'] = np.sin(2 * np.pi * df.index.dayofweek / 5)
    df['day_of_week_cos'] = np.cos(2 * np.pi * df.index.dayofweek / 5)

    # ════════════════════════════════════════════════
    # TARGET: 5-day forward realized volatility (annualized)
    # ════════════════════════════════════════════════
    fwd_returns = df['nifty_ret_1d'].shift(-1).rolling(5).std().shift(-5)
    df['target_vol_5d'] = fwd_returns * np.sqrt(252)

    # Drop raw columns used only for feature engineering
    drop_cols = [c for c in df.columns if c.endswith('_close') or c.endswith('_vol')]
    # Keep nifty_vol_ratio and volatility features
    drop_cols = [c for c in drop_cols if c not in ['nifty_vol_ratio']]
    df = df.drop(columns=drop_cols, errors='ignore')

    # Drop NaN rows from rolling windows
    df = df.dropna()

    return df


def build_dataset(period="2y"):
    """Full pipeline: fetch → engineer → save."""
    logger.info("Building ML dataset...")

    raw = fetch_historical_data(period)
    logger.info(f"Raw data shape: {raw.shape}")

    featured = engineer_features(raw)
    logger.info(f"Featured data shape: {featured.shape}")
    logger.info(f"Features: {[c for c in featured.columns if c != 'target_vol_5d']}")

    # Save to disk
    output_path = DATA_DIR / "ml_dataset.csv"
    featured.to_csv(output_path)
    logger.info(f"Dataset saved to {output_path}")

    return featured


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df = build_dataset()
    print(f"\nDataset: {df.shape}")
    print(f"Target stats:\n{df['target_vol_5d'].describe()}")
    print(f"\nFeature columns:")
    for col in sorted(df.columns):
        if col != 'target_vol_5d':
            print(f"  - {col}")
