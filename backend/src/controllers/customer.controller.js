/**
 * Customer Controller
 */

const customerService = require('../services/customer.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class CustomerController {
  async list(req, res, next) {
    try {
      const result = await customerService.getCustomers(req.query);
      return paginatedResponse(res, result.customers, result.page, result.limit, result.total, 'Customers retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return successResponse(res, customer, 'Customer retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async get360(req, res, next) {
    try {
      const profile360 = await customerService.getCustomer360(req.params.id);
      return successResponse(res, profile360, 'Customer 360 profile retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getJourney(req, res, next) {
    try {
      const journey = await customerService.getCustomerJourney(req.params.id);
      return successResponse(res, journey, 'Customer journey timeline retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
