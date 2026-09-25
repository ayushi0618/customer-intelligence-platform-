/**
 * Recommendation Routes
 */

const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', (req, res, next) => recommendationController.list(req, res, next));
router.patch('/:id/status', requireRoles(['Admin', 'Marketing Manager']), (req, res, next) => recommendationController.updateStatus(req, res, next));
router.post('/generate', requireRoles(['Admin', 'Data Analyst', 'Marketing Manager']), (req, res, next) => recommendationController.generate(req, res, next));

module.exports = router;
