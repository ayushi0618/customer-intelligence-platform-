/**
 * Campaign Routes
 */

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res, next) => campaignController.list(req, res, next));
router.get('/:id', (req, res, next) => campaignController.getById(req, res, next));

module.exports = router;
