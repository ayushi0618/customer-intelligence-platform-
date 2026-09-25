/**
 * Machine Learning Controller
 * Interacts with MySQL model_runs, churn_predictions, clv_predictions,
 * and coordinates with the Python FastAPI ML microservice.
 */

const { pool } = require('../config/database');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class MlController {
  /**
   * Get all registered model runs and evaluation metrics from MySQL
   */
  async getModels(req, res, next) {
    try {
      const [rows] = await pool.query(`
        SELECT id, model_type, model_version, training_timestamp, training_row_count,
               feature_names, hyperparameters, metrics, artifact_path, status, created_at
        FROM model_runs
        ORDER BY training_timestamp DESC;
      `);

      const models = rows.map(r => ({
        id: r.id,
        modelType: r.model_type,
        modelVersion: r.model_version,
        trainingTimestamp: r.training_timestamp,
        trainingRowCount: r.training_row_count,
        featureNames: typeof r.feature_names === 'string' ? JSON.parse(r.feature_names) : r.feature_names,
        hyperparameters: typeof r.hyperparameters === 'string' ? JSON.parse(r.hyperparameters) : r.hyperparameters,
        metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics,
        artifactPath: r.artifact_path,
        status: r.status,
        createdAt: r.created_at
      }));

      return successResponse(res, models, 'Model runs retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * List churn predictions with customer details
   */
  async getChurnPredictions(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const offset = (page - 1) * limit;
      const { riskLevel, minProbability } = req.query;

      const conditions = [];
      const params = [];

      if (riskLevel) {
        conditions.push('cp.risk_level = ?');
        params.push(riskLevel);
      }
      if (minProbability) {
        conditions.push('cp.churn_probability >= ?');
        params.push(parseFloat(minProbability));
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const [cntRows] = await pool.query(`SELECT COUNT(*) as total FROM churn_predictions cp ${where};`, params);
      const total = cntRows[0].total;

      const sql = `
        SELECT cp.id, cp.customer_id, cp.churn_probability, cp.risk_level, cp.prediction_timestamp,
               mr.model_version,
               c.first_name, c.last_name, c.email as customer_email, c.preferred_channel
        FROM churn_predictions cp
        JOIN model_runs mr ON cp.model_run_id = mr.id
        JOIN customers c ON cp.customer_id = c.id
        ${where}
        ORDER BY cp.churn_probability DESC
        LIMIT ? OFFSET ?;
      `;

      const [rows] = await pool.query(sql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

      const predictions = rows.map(r => ({
        id: r.id,
        customerId: r.customer_id,
        customerName: `${r.first_name} ${r.last_name}`,
        customerEmail: r.customer_email,
        preferredChannel: r.preferred_channel,
        churnProbability: parseFloat(r.churn_probability),
        riskLevel: r.risk_level,
        modelVersion: r.model_version,
        predictionTimestamp: r.prediction_timestamp
      }));

      return paginatedResponse(res, predictions, page, limit, total, 'Churn predictions retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * List CLV predictions with customer details
   */
  async getClvPredictions(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const offset = (page - 1) * limit;
      const { minClv } = req.query;

      const conditions = [];
      const params = [];

      if (minClv) {
        conditions.push('clv.predicted_clv >= ?');
        params.push(parseFloat(minClv));
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const [cntRows] = await pool.query(`SELECT COUNT(*) as total FROM clv_predictions clv ${where};`, params);
      const total = cntRows[0].total;

      const sql = `
        SELECT clv.id, clv.customer_id, clv.predicted_clv, clv.prediction_horizon_days, clv.prediction_timestamp,
               mr.model_version,
               c.first_name, c.last_name, c.email as customer_email, c.preferred_channel
        FROM clv_predictions clv
        JOIN model_runs mr ON clv.model_run_id = mr.id
        JOIN customers c ON clv.customer_id = c.id
        ${where}
        ORDER BY clv.predicted_clv DESC
        LIMIT ? OFFSET ?;
      `;

      const [rows] = await pool.query(sql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

      const predictions = rows.map(r => ({
        id: r.id,
        customerId: r.customer_id,
        customerName: `${r.first_name} ${r.last_name}`,
        customerEmail: r.customer_email,
        preferredChannel: r.preferred_channel,
        predictedClv: parseFloat(r.predicted_clv),
        predictionHorizonDays: r.prediction_horizon_days,
        modelVersion: r.model_version,
        predictionTimestamp: r.prediction_timestamp
      }));

      return paginatedResponse(res, predictions, page, limit, total, 'CLV predictions retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * List K-Means cluster distribution
   */
  async getClusterDistribution(req, res, next) {
    try {
      const [rows] = await pool.query(`
        SELECT cluster_id, cluster_label,
               COUNT(id) as customer_count,
               AVG(distance_to_centroid) as avg_distance
        FROM customer_segments
        GROUP BY cluster_id, cluster_label
        ORDER BY cluster_id ASC;
      `);

      return successResponse(res, rows.map(r => ({
        clusterId: r.cluster_id,
        clusterLabel: r.cluster_label,
        customerCount: parseInt(r.customer_count, 10),
        avgDistance: r.avg_distance ? parseFloat(parseFloat(r.avg_distance).toFixed(3)) : null
      })), 'Cluster distribution retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forward training trigger to Python FastAPI service
   */
  async triggerTraining(req, res, next) {
    try {
      const { modelType } = req.params; // clustering, churn, clv
      const validTypes = ['clustering', 'churn', 'clv'];
      if (!validTypes.includes(modelType)) {
        return errorResponse(res, `Invalid model type '${modelType}'. Must be one of: ${validTypes.join(', ')}`, 400, 'INVALID_MODEL_TYPE');
      }

      console.log(`Forwarding training trigger for '${modelType}' to Python ML Service at ${ML_SERVICE_URL}...`);
      const targetEndpoint = `${ML_SERVICE_URL}/ml/train/${modelType}`;

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {})
      });

      const data = await response.json();
      if (!response.ok) {
        return errorResponse(res, data.detail || 'Training failed in ML service.', response.status, 'ML_SERVICE_ERROR');
      }

      return successResponse(res, data, `Model training for ${modelType} completed successfully.`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
        return errorResponse(res, `Python ML service is not reachable at ${ML_SERVICE_URL}. Please ensure FastAPI is running.`, 503, 'ML_SERVICE_UNAVAILABLE');
      }
      next(error);
    }
  }

  /**
   * Forward batch prediction trigger to Python FastAPI service
   */
  async triggerBatchPredictions(req, res, next) {
    try {
      console.log(`Forwarding batch prediction trigger to Python ML Service at ${ML_SERVICE_URL}...`);
      const response = await fetch(`${ML_SERVICE_URL}/ml/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {})
      });

      const data = await response.json();
      if (!response.ok) {
        return errorResponse(res, data.detail || 'Prediction failed in ML service.', response.status, 'ML_SERVICE_ERROR');
      }

      return successResponse(res, data, 'Batch predictions executed and stored in MySQL.');
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
        return errorResponse(res, `Python ML service is not reachable at ${ML_SERVICE_URL}. Please ensure FastAPI is running.`, 503, 'ML_SERVICE_UNAVAILABLE');
      }
      next(error);
    }
  }
}

module.exports = new MlController();
