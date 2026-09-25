/**
 * Order Controller
 */

const orderRepository = require('../repositories/order.repository');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');

class OrderController {
  async list(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const customerId = req.query.customerId ? parseInt(req.query.customerId, 10) : null;
      const { status, channel, startDate, endDate } = req.query;

      const result = await orderRepository.findAll({ page, limit, customerId, status, channel, startDate, endDate });
      return paginatedResponse(res, result.orders, result.page, result.limit, result.total, 'Orders retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await orderRepository.findById(req.params.id);
      if (!order) {
        return errorResponse(res, `Order with ID ${req.params.id} not found.`, 404, 'ORDER_NOT_FOUND');
      }
      return successResponse(res, order, 'Order details retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
