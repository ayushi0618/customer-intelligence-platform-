/**
 * RFM Routes
 */

const express = require('express');
const router = express.Router();
const rfmController = require('../controllers/rfm.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/overview', (req, res, next) => rfmController.getOverview(req, res, next));
router.get('/distribution', (req, res, next) => rfmController.getDistribution(req, res, next));
router.post('/recalculate', requireRoles(['Admin', 'Data Analyst']), (req, res, next) => rfmController.recalculate(req, res, next));

module.exports = router;
