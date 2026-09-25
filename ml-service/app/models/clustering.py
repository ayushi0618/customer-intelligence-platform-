"""
K-Means Customer Behavioral Clustering
Multi-Channel Customer Behaviour & Marketing Intelligence System
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib
from pathlib import Path
from app.config import ARTIFACT_DIR

FEATURE_COLS = [
    "recency_days",
    "frequency_orders",
    "monetary_total",
    "avg_order_value",
    "web_sessions_count",
    "campaign_click_rate"
]

CLUSTER_LABELS = {
    0: "High Spend - Frequent Digital",
    1: "Discount Hunters",
    2: "Dormant Seasonal Buyers",
    3: "New Engaged Explorers"
}

def train_clustering(df, n_clusters=4):
    """
    Standardizes feature matrix, evaluates candidate K values,
    trains K-Means model, and computes inertia and silhouette score.
    """
    X = df[FEATURE_COLS].copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Evaluate K candidates (3 to 6)
    k_eval = {}
    for k in range(3, 7):
        km_test = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels_test = km_test.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels_test)
        k_eval[k] = {
            "inertia": float(km_test.inertia_),
            "silhouette_score": float(sil)
        }

    # Fit final model
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_ids = model.fit_predict(X_scaled)
    final_sil = silhouette_score(X_scaled, cluster_ids)

    # Distance to centroids
    distances = np.min(model.transform(X_scaled), axis=1)

    df["cluster_id"] = cluster_ids
    df["cluster_label"] = [CLUSTER_LABELS.get(c, f"Cluster {c}") for c in cluster_ids]
    df["distance_to_centroid"] = distances

    # Save artifacts
    model_version = f"kmeans_v1.0.0_{datetime_now_str()}"
    artifact_filename = f"clustering_{model_version}.joblib"
    artifact_path = str(ARTIFACT_DIR / artifact_filename)

    joblib.dump({"scaler": scaler, "model": model, "feature_cols": FEATURE_COLS}, artifact_path)

    metrics = {
        "n_clusters": n_clusters,
        "silhouette_score": float(final_sil),
        "inertia": float(model.inertia_),
        "k_evaluation": k_eval
    }

    return {
        "model_version": model_version,
        "feature_cols": FEATURE_COLS,
        "metrics": metrics,
        "artifact_path": artifact_path,
        "df_result": df
    }

def datetime_now_str():
    from datetime import datetime
    return datetime.utcnow().strftime("%Y%m%d_%H%M%S")
