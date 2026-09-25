"""
Supervised Churn Classification Model
Multi-Channel Customer Behaviour & Marketing Intelligence System
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, average_precision_score,
    precision_score, recall_score, f1_score, confusion_matrix
)
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
    "product_views_count",
    "cart_additions_count",
    "campaign_click_rate",
    "cart_abandon_rate"
]

def map_risk_level(prob):
    if prob >= 0.70:
        return "HIGH"
    elif prob >= 0.35:
        return "MEDIUM"
    return "LOW"

def train_churn(df):
    """
    Trains Logistic Regression and Random Forest classifiers on historical feature matrix,
    evaluates ROC-AUC, PR-AUC, Precision, Recall, F1, and selects the optimal model.
    """
    # Filter active customers who had at least 1 order in observation window
    df_train = df[df["frequency_orders"] > 0].copy()
    if len(df_train) < 50:
        raise ValueError("Insufficient customer training data for Churn model.")

    X = df_train[FEATURE_COLS]
    y = df_train["churn_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Candidate 1: Logistic Regression
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train_scaled, y_train)
    lr_probs = lr.predict_proba(X_test_scaled)[:, 1]
    lr_auc = roc_auc_score(y_test, lr_probs)

    # Candidate 2: Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42)
    rf.fit(X_train, y_train)
    rf_probs = rf.predict_proba(X_test)[:, 1]
    rf_auc = roc_auc_score(y_test, rf_probs)

    # Select best model
    if rf_auc >= lr_auc:
        best_model_name = "RandomForestClassifier"
        best_model = rf
        probs = rf_probs
        uses_scaler = False
    else:
        best_model_name = "LogisticRegression"
        best_model = lr
        probs = lr_probs
        uses_scaler = True

    preds = (probs >= 0.5).astype(int)

    metrics = {
        "candidate_models": {
            "LogisticRegression_ROC_AUC": float(lr_auc),
            "RandomForest_ROC_AUC": float(rf_auc)
        },
        "selected_model": best_model_name,
        "roc_auc": float(roc_auc_score(y_test, probs)),
        "pr_auc": float(average_precision_score(y_test, probs)),
        "precision": float(precision_score(y_test, preds, zero_division=0)),
        "recall": float(recall_score(y_test, preds, zero_division=0)),
        "f1_score": float(f1_score(y_test, preds, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, preds).tolist()
    }

    # Save artifact
    version_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    model_version = f"churn_v1.0.0_{version_str}"
    artifact_filename = f"churn_{model_version}.joblib"
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

def predict_churn(df_features, model_artifact):
    """
    Generates churn predictions and risk levels for customer feature matrix.
    """
    scaler = model_artifact["scaler"]
    model = model_artifact["model"]
    uses_scaler = model_artifact["uses_scaler"]

    X = df_features[FEATURE_COLS]
    if uses_scaler and scaler:
        X_eval = scaler.transform(X)
    else:
        X_eval = X

    probs = model.predict_proba(X_eval)[:, 1]
    risk_levels = [map_risk_level(p) for p in probs]

    return probs, risk_levels
