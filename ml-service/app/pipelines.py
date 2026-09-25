"""
ML Training & Inference Pipelines
Multi-Channel Customer Behaviour & Marketing Intelligence System
"""

import json
from datetime import datetime
import joblib
from app.database import get_db_connection
from app.features import extract_features
from app.models.clustering import train_clustering
from app.models.churn import train_churn, predict_churn
from app.models.clv import train_clv, predict_clv

def log_model_run(cnx, model_type, model_version, row_count, feature_names, hyperparameters, metrics, artifact_path):
    """
    Inserts a new model run into the MySQL model_runs table.
    """
    cursor = cnx.cursor()
    # Deactivate older active models of the same type
    cursor.execute("UPDATE model_runs SET status = 'DEPRECATED' WHERE model_type = %s AND status = 'ACTIVE';", (model_type,))

    sql = """
        INSERT INTO model_runs
            (model_type, model_version, training_timestamp, training_row_count, feature_names, hyperparameters, metrics, artifact_path, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'ACTIVE', NOW());
    """
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(sql, (
        model_type,
        model_version,
        now_str,
        row_count,
        json.dumps(feature_names),
        json.dumps(hyperparameters),
        json.dumps(metrics),
        artifact_path
    ))
    model_run_id = cursor.lastrowid
    cnx.commit()
    cursor.close()
    return model_run_id

def run_clustering_pipeline():
    print("Starting K-Means Clustering Training Pipeline...")
    df_features = extract_features(is_inference=False)
    result = train_clustering(df_features, n_clusters=4)

    cnx = get_db_connection()
    try:
        model_run_id = log_model_run(
            cnx,
            model_type="KMEANS_CLUSTERING",
            model_version=result["model_version"],
            row_count=len(df_features),
            feature_names=result["feature_cols"],
            hyperparameters={"n_clusters": 4, "random_state": 42},
            metrics=result["metrics"],
            artifact_path=result["artifact_path"]
        )

        # Batch insert cluster assignments into customer_segments
        cursor = cnx.cursor()
        cursor.execute("DELETE FROM customer_segments WHERE model_run_id = %s;", (model_run_id,))
        
        df_res = result["df_result"]
        records = []
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        for _, row in df_res.iterrows():
            records.append((
                int(row["customer_id"]),
                model_run_id,
                int(row["cluster_id"]),
                str(row["cluster_label"]),
                float(row["distance_to_centroid"]),
                now_str
            ))

        sql_insert = """
            INSERT INTO customer_segments
                (customer_id, model_run_id, cluster_id, cluster_label, distance_to_centroid, assigned_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                cluster_id = VALUES(cluster_id),
                cluster_label = VALUES(cluster_label),
                distance_to_centroid = VALUES(distance_to_centroid),
                assigned_at = VALUES(assigned_at);
        """
        cursor.executemany(sql_insert, records)
        cnx.commit()
        cursor.close()

        print(f"K-Means Clustering Pipeline completed successfully. Assigned {len(records)} segments.")
        return {
            "model_run_id": model_run_id,
            "model_version": result["model_version"],
            "metrics": result["metrics"],
            "assigned_customers": len(records)
        }
    finally:
        cnx.close()

def run_churn_pipeline():
    print("Starting Churn Classification Training Pipeline...")
    df_features = extract_features(is_inference=False)
    result = train_churn(df_features)

    cnx = get_db_connection()
    try:
        model_run_id = log_model_run(
            cnx,
            model_type="CHURN_CLASSIFICATION",
            model_version=result["model_version"],
            row_count=result["training_rows"],
            feature_names=result["feature_cols"],
            hyperparameters={"selected_model": result["metrics"]["selected_model"], "stratify": True},
            metrics=result["metrics"],
            artifact_path=result["artifact_path"]
        )

        # Generate predictions for all active customers up to NOW
        df_curr = extract_features(is_inference=True)
        model_artifact = joblib.load(result["artifact_path"])
        probs, risk_levels = predict_churn(df_curr, model_artifact)

        df_curr["churn_probability"] = probs
        df_curr["risk_level"] = risk_levels

        cursor = cnx.cursor()
        records = []
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        for _, row in df_curr.iterrows():
            records.append((
                int(row["customer_id"]),
                model_run_id,
                float(row["churn_probability"]),
                str(row["risk_level"]),
                now_str
            ))

        sql_insert = """
            INSERT INTO churn_predictions
                (customer_id, model_run_id, churn_probability, risk_level, prediction_timestamp)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                churn_probability = VALUES(churn_probability),
                risk_level = VALUES(risk_level),
                prediction_timestamp = VALUES(prediction_timestamp);
        """
        cursor.executemany(sql_insert, records)
        cnx.commit()
        cursor.close()

        print(f"Churn Classification Pipeline completed successfully. Scored {len(records)} customers.")
        return {
            "model_run_id": model_run_id,
            "model_version": result["model_version"],
            "metrics": result["metrics"],
            "scored_customers": len(records)
        }
    finally:
        cnx.close()

def run_clv_pipeline():
    print("Starting CLV Regression Training Pipeline...")
    df_features = extract_features(is_inference=False)
    result = train_clv(df_features)

    cnx = get_db_connection()
    try:
        model_run_id = log_model_run(
            cnx,
            model_type="CLV_REGRESSION",
            model_version=result["model_version"],
            row_count=result["training_rows"],
            feature_names=result["feature_cols"],
            hyperparameters={"selected_model": result["metrics"]["selected_model"], "prediction_horizon_days": 180},
            metrics=result["metrics"],
            artifact_path=result["artifact_path"]
        )

        # Generate predictions for all active customers up to NOW
        df_curr = extract_features(is_inference=True)
        model_artifact = joblib.load(result["artifact_path"])
        preds = predict_clv(df_curr, model_artifact)

        df_curr["predicted_clv"] = preds

        cursor = cnx.cursor()
        records = []
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        for _, row in df_curr.iterrows():
            records.append((
                int(row["customer_id"]),
                model_run_id,
                float(row["predicted_clv"]),
                180,
                now_str
            ))

        sql_insert = """
            INSERT INTO clv_predictions
                (customer_id, model_run_id, predicted_clv, prediction_horizon_days, prediction_timestamp)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                predicted_clv = VALUES(predicted_clv),
                prediction_horizon_days = VALUES(prediction_horizon_days),
                prediction_timestamp = VALUES(prediction_timestamp);
        """
        cursor.executemany(sql_insert, records)
        cnx.commit()
        cursor.close()

        print(f"CLV Regression Pipeline completed successfully. Scored {len(records)} customers.")
        return {
            "model_run_id": model_run_id,
            "model_version": result["model_version"],
            "metrics": result["metrics"],
            "scored_customers": len(records)
        }
    finally:
        cnx.close()
