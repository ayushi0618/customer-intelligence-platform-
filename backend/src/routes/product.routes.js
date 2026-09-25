/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/categories', (req, res, next) => productController.getCategories(req, res, next));
router.get('/', (req, res, next) => productController.list(req, res, next));
router.get('/:id', (req, res, next) => productController.getById(req, res, next));

module.exports = router;
