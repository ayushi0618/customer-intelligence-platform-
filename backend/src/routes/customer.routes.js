/**
 * Customer Routes
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res, next) => customerController.list(req, res, next));
router.get('/:id', (req, res, next) => customerController.getById(req, res, next));
router.get('/:id/360', (req, res, next) => customerController.get360(req, res, next));
router.get('/:id/journey', (req, res, next) => customerController.getJourney(req, res, next));

module.exports = router;
