"""
FastAPI Machine Learning Service Entrypoint
Multi-Channel Customer Behaviour & Marketing Intelligence System
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

from app.pipelines import (
    run_clustering_pipeline,
    run_churn_pipeline,
    run_clv_pipeline
)

app = FastAPI(
    title="Customer Intelligence Machine Learning Microservice",
    description="Python FastAPI engine for feature engineering, K-Means clustering, Churn prediction, and CLV regression.",
    version="1.0.0"
)

@app.get("/ml/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ML Intelligence Service",
        "engine": "Python 3.12 / Scikit-Learn / FastAPI",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/ml/train/clustering")
def train_clustering_endpoint():
    try:
        result = run_clustering_pipeline()
        return {
            "success": True,
            "message": "K-Means customer clustering pipeline completed successfully.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/train/churn")
def train_churn_endpoint():
    try:
        result = run_churn_pipeline()
        return {
            "success": True,
            "message": "Churn classification pipeline completed successfully.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/train/clv")
def train_clv_endpoint():
    try:
        result = run_clv_pipeline()
        return {
            "success": True,
            "message": "CLV regression pipeline completed successfully.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/predict/batch")
def batch_predict_endpoint():
    try:
        res_clust = run_clustering_pipeline()
        res_churn = run_churn_pipeline()
        res_clv = run_clv_pipeline()
        return {
            "success": True,
            "message": "Batch inference and clustering completed across all models.",
            "data": {
                "clustering": res_clust,
                "churn": res_churn,
                "clv": res_clv
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
