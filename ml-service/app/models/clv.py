"""
Customer Lifetime Value (CLV) Regression Model
Multi-Channel Customer Behaviour & Marketing Intelligence System
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import joblib
from datetime import datetime
from app.config import ARTIFACT_DIR

FEATURE_COLS = [
    "recency_days",
    "frequency_orders",
    "monetary_total",
    "avg_order_value",
    "days_as_customer",
    "web_sessions_count",
    "total_page_views",
    "cart_additions_count",
    "campaign_click_rate"
]

def train_clv(df):
    """
    Trains Ridge Regression, Random Forest Regressor, and Gradient Boosting Regressor
    to predict 180-day future customer monetary value. Evaluates MAE, RMSE, and R2.
    """
    df_train = df[df["frequency_orders"] > 0].copy()
    if len(df_train) < 50:
        raise ValueError("Insufficient customer training data for CLV model.")

    X = df_train[FEATURE_COLS]
    y = df_train["future_spend_180d"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Candidate 1: Ridge Regression
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train_scaled, y_train)
    ridge_preds = np.maximum(0.0, ridge.predict(X_test_scaled))
    ridge_r2 = r2_score(y_test, ridge_preds)

    # Candidate 2: Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train, y_train)
    rf_preds = np.maximum(0.0, rf.predict(X_test))
    rf_r2 = r2_score(y_test, rf_preds)

    # Candidate 3: Gradient Boosting Regressor
    gb = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
    gb.fit(X_train, y_train)
    gb_preds = np.maximum(0.0, gb.predict(X_test))
    gb_r2 = r2_score(y_test, gb_preds)

    # Select best model based on R2
    candidates = [
        ("RidgeRegression", ridge, ridge_preds, ridge_r2, True),
        ("RandomForestRegressor", rf, rf_preds, rf_r2, False),
        ("GradientBoostingRegressor", gb, gb_preds, gb_r2, False)
    ]
    candidates.sort(key=lambda item: item[3], reverse=True)
    best_name, best_model, best_preds, best_r2, uses_scaler = candidates[0]

    mae = mean_absolute_error(y_test, best_preds)
    rmse = root_mean_squared_error(y_test, best_preds)

    metrics = {
        "candidate_models": {
            "Ridge_R2": float(ridge_r2),
            "RandomForest_R2": float(rf_r2),
            "GradientBoosting_R2": float(gb_r2)
        },
        "selected_model": best_name,
        "r2_score": float(best_r2),
        "mae": float(mae),
        "rmse": float(rmse),
        "prediction_horizon_days": 180
    }

    # Save artifact
    version_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    model_version = f"clv_v1.0.0_{version_str}"
    artifact_filename = f"clv_{model_version}.joblib"
    artifact_path = str(ARTIFACT_DIR / artifact_filename)

    joblib.dump({
        "scaler": scaler if uses_scaler else None,
        "model": best_model,
        "uses_scaler": uses_scaler,
        "feature_cols": FEATURE_COLS
    }, artifact_path)

    return {
        "model_version": model_version,
        "feature_cols": FEATURE_COLS,
        "metrics": metrics,
        "artifact_path": artifact_path,
        "training_rows": len(df_train)
    }

def predict_clv(df_features, model_artifact):
    """
    Generates predicted 180-day monetary value for customer feature matrix.
    """
    scaler = model_artifact["scaler"]
    model = model_artifact["model"]
    uses_scaler = model_artifact["uses_scaler"]

    X = df_features[FEATURE_COLS]
    if uses_scaler and scaler:
        X_eval = scaler.transform(X)
    else:
        X_eval = X

    preds = model.predict(X_eval)
    # Clip negative values to zero
    return np.maximum(0.0, np.round(preds, 2))
