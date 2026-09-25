/**
 * Product Controller
 */

const productRepository = require('../repositories/product.repository');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');

class ProductController {
  async getCategories(req, res, next) {
    try {
      const categories = await productRepository.getCategories();
      return successResponse(res, categories, 'Product categories retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : null;
      const search = (req.query.search || '').trim();

      const result = await productRepository.findAll({ page, limit, categoryId, search });
      return paginatedResponse(res, result.products, result.page, result.limit, result.total, 'Products retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productRepository.findById(req.params.id);
      if (!product) {
        return errorResponse(res, `Product with ID ${req.params.id} not found.`, 404, 'PRODUCT_NOT_FOUND');
      }
      return successResponse(res, product, 'Product details retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
