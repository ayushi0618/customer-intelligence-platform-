"""
Run initial model training and prediction generation
"""

import sys
from pathlib import Path

# Add ml-service to path
ml_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(ml_dir))

from app.pipelines import (
    run_clustering_pipeline,
    run_churn_pipeline,
    run_clv_pipeline
)

if __name__ == "__main__":
    print("=== EXECUTING MACHINE LEARNING PIPELINES ===")
    res_clust = run_clustering_pipeline()
    print("Clustering Result:", res_clust["metrics"])

    res_churn = run_churn_pipeline()
    print("Churn Result:", res_churn["metrics"])

    res_clv = run_clv_pipeline()
    print("CLV Result:", res_clv["metrics"])

    print("\nALL ML MODELS TRAINED & PREDICTIONS STORED IN MYSQL!")
