"""
India Macro Terminal — Train & Save the Volatility Model
Run: python src/ml/run_training.py
"""

import sys
import logging
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "src"))

from ml.data_builder import build_dataset
from ml.trainer import train_model, save_model

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    print("=" * 60)
    print("  INDIA MACRO TERMINAL -- ML TRAINING PIPELINE")
    print("  LightGBM 5-Day Nifty Volatility Forecaster")
    print("=" * 60)

    # Step 1: Build dataset
    print("\n[1/3] Fetching historical data & engineering features...")
    df = build_dataset(period="2y")
    print(f"  [OK] Dataset: {df.shape[0]} samples, {df.shape[1]} columns")
    print(f"  [OK] Target (5d vol): mean={df['target_vol_5d'].mean():.4f}, "
          f"std={df['target_vol_5d'].std():.4f}")

    # Step 2: Train
    feature_cols = [c for c in df.columns if c != 'target_vol_5d']
    print(f"\n[2/3] Training LightGBM with {len(feature_cols)} features...")
    model, metrics, importances = train_model(df, n_splits=5)

    print(f"\n  -- RESULTS --")
    print(f"  Avg MAE:  {metrics['avg_mae']:.4f}")
    print(f"  Avg RMSE: {metrics['avg_rmse']:.4f}")
    print(f"  Folds:    {metrics['n_splits']}")

    print(f"\n  -- TOP 10 FEATURES --")
    for i, (feat, imp) in enumerate(list(importances.items())[:10]):
        bar = "#" * max(1, int(imp / max(importances.values()) * 20))
        print(f"  {i+1:2d}. {feat:<25s} {imp:4d}  {bar}")

    # Step 3: Save
    print(f"\n[3/3] Saving model...")
    save_model(model, feature_cols)
    print(f"  [OK] Model saved to models/vol_model.joblib")

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE -- Model ready for live inference")
    print("=" * 60)


if __name__ == "__main__":
    main()
