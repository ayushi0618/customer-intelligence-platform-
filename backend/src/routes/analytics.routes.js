/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));
router.get('/revenue', (req, res, next) => analyticsController.getRevenueTrend(req, res, next));
router.get('/channels', (req, res, next) => analyticsController.getChannelAnalytics(req, res, next));
router.get('/products', (req, res, next) => analyticsController.getProductPerformance(req, res, next));
router.get('/funnel', (req, res, next) => analyticsController.getFunnel(req, res, next));

module.exports = router;
