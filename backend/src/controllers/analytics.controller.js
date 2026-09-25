/**
 * Analytics Controller
 */

const analyticsRepository = require('../repositories/analytics.repository');
const { successResponse } = require('../utils/response');

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const { startDate, endDate, channel } = req.query;
      const overview = await analyticsRepository.getOverview({ startDate, endDate, channel });
      return successResponse(res, overview, 'Executive overview metrics retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getRevenueTrend(req, res, next) {
    try {
      const { interval, startDate, endDate } = req.query;
      const trend = await analyticsRepository.getRevenueTrend({ interval, startDate, endDate });
      return successResponse(res, trend, 'Revenue trend retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getChannelAnalytics(req, res, next) {
    try {
      const channels = await analyticsRepository.getChannelAnalytics();
      return successResponse(res, channels, 'Channel breakdown retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getProductPerformance(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : null;
      const products = await analyticsRepository.getProductPerformance({ limit, categoryId });
      return successResponse(res, products, 'Product performance metrics retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getFunnel(req, res, next) {
    try {
      const { startDate, endDate, deviceType, trafficSource } = req.query;
      const funnel = await analyticsRepository.getFunnel({ startDate, endDate, deviceType, trafficSource });
      return successResponse(res, funnel, 'Conversion funnel metrics retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
