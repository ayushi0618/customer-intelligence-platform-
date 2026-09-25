/**
 * Machine Learning & Predictions Routes
 */

const express = require('express');
const router = express.Router();
const mlController = require('../controllers/ml.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

router.use(authenticateToken);

// Model registry & predictions
router.get('/models', (req, res, next) => mlController.getModels(req, res, next));
router.get('/clusters', (req, res, next) => mlController.getClusterDistribution(req, res, next));
router.get('/predictions/churn', (req, res, next) => mlController.getChurnPredictions(req, res, next));
router.get('/predictions/clv', (req, res, next) => mlController.getClvPredictions(req, res, next));

// Training & inference execution (Restricted to Admin and Data Analyst)
router.post('/train/:modelType', requireRoles(['Admin', 'Data Analyst']), (req, res, next) => mlController.triggerTraining(req, res, next));
router.post('/predict/batch', requireRoles(['Admin', 'Data Analyst']), (req, res, next) => mlController.triggerBatchPredictions(req, res, next));

module.exports = router;
