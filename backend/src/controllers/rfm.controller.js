/**
 * RFM Controller
 */

const rfmService = require('../services/rfm.service');
const { successResponse } = require('../utils/response');

class RfmController {
  async getOverview(req, res, next) {
    try {
      const overview = await rfmService.getOverview();
      return successResponse(res, overview, 'RFM overview and segments retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getDistribution(req, res, next) {
    try {
      const distribution = await rfmService.getDistribution();
      return successResponse(res, distribution, 'RFM matrix distribution retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async recalculate(req, res, next) {
    try {
      const result = await rfmService.recalculate();
      return successResponse(res, result, 'RFM scores successfully recalculated.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RfmController();
