/**
 * Recommendation Controller
 */

const recommendationService = require('../services/recommendation.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class RecommendationController {
  async list(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const { status, priority, type, channel, search } = req.query;

      const result = await recommendationService.getRecommendations({ page, limit, status, priority, type, channel, search });
      return paginatedResponse(res, result.recommendations, result.page, result.limit, result.total, 'Recommendations retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      const updated = await recommendationService.updateStatus(req.params.id, { status, notes });
      return successResponse(res, updated, 'Recommendation status updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async generate(req, res, next) {
    try {
      const result = await recommendationService.generateRecommendations();
      return successResponse(res, result, 'Recommendations generated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecommendationController();
