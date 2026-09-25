/**
 * Attribution Routes
 */

const express = require('express');
const router = express.Router();
const attributionController = require('../controllers/attribution.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/compare', (req, res, next) => attributionController.compare(req, res, next));
router.post('/recalculate', requireRoles(['Admin', 'Data Analyst', 'Marketing Manager']), (req, res, next) => attributionController.recalculate(req, res, next));

module.exports = router;
