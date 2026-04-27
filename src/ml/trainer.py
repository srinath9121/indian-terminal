"""
India Macro Terminal — LightGBM Volatility Trainer
Trains a 5-day Nifty volatility forecaster using TimeSeriesSplit.
Saves the model to models/vol_model.joblib.
"""

import logging
import numpy as np
import joblib
from pathlib import Path

import lightgbm as lgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / "vol_model.joblib"


def train_model(df, n_splits=5):
    """
    Train LightGBM regressor using TimeSeriesSplit.
    Returns: (model, metrics_dict, feature_importances)
    """
    feature_cols = [c for c in df.columns if c != 'target_vol_5d']
    X = df[feature_cols].values
    y = df['target_vol_5d'].values

    logger.info(f"Training with {X.shape[0]} samples, {X.shape[1]} features")
    logger.info(f"Target range: {y.min():.4f} — {y.max():.4f}")

    tscv = TimeSeriesSplit(n_splits=n_splits)

    params = {
        'objective': 'regression',
        'metric': 'mae',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.8,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': -1,
        'n_estimators': 300,
        'early_stopping_rounds': 30,
    }

    fold_metrics = []
    best_model = None
    best_mae = float('inf')

    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        model = lgb.LGBMRegressor(**params)
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
        )

        y_pred = model.predict(X_val)
        mae = mean_absolute_error(y_val, y_pred)
        rmse = np.sqrt(mean_squared_error(y_val, y_pred))

        fold_metrics.append({'fold': fold + 1, 'mae': mae, 'rmse': rmse})
        logger.info(f"  Fold {fold+1}: MAE={mae:.4f}, RMSE={rmse:.4f}")

        if mae < best_mae:
            best_mae = mae
            best_model = model

    # Feature importances
    importances = dict(zip(feature_cols, best_model.feature_importances_))
    importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))

    avg_mae = np.mean([m['mae'] for m in fold_metrics])
    avg_rmse = np.mean([m['rmse'] for m in fold_metrics])

    metrics = {
        'avg_mae': round(avg_mae, 4),
        'avg_rmse': round(avg_rmse, 4),
        'n_splits': n_splits,
        'n_samples': X.shape[0],
        'n_features': X.shape[1],
        'folds': fold_metrics,
    }

    logger.info(f"Average MAE: {avg_mae:.4f}, Average RMSE: {avg_rmse:.4f}")

    return best_model, metrics, importances


def save_model(model, feature_cols):
    """Save model + feature column names to disk."""
    artifact = {
        'model': model,
        'feature_cols': feature_cols,
        'version': '1.0',
    }
    joblib.dump(artifact, MODEL_PATH)
    logger.info(f"Model saved to {MODEL_PATH}")


def load_model():
    """Load saved model artifact."""
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)


def predict_volatility(df_row, model_artifact=None):
    """
    Predict 5-day forward volatility for a single row of features.
    Returns: predicted annualized volatility (float)
    """
    if model_artifact is None:
        model_artifact = load_model()
    if model_artifact is None:
        return None

    model = model_artifact['model']
    feature_cols = model_artifact['feature_cols']

    X = df_row[feature_cols].values.reshape(1, -1)
    pred = model.predict(X)[0]
    return round(float(pred), 4)
