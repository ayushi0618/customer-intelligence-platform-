/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res, next) => orderController.list(req, res, next));
router.get('/:id', (req, res, next) => orderController.getById(req, res, next));

module.exports = router;
