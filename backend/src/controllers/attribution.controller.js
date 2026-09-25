/**
 * Attribution Controller
 */

const attributionService = require('../services/attribution.service');
const { successResponse } = require('../utils/response');

class AttributionController {
  async compare(req, res, next) {
    try {
      const comparison = await attributionService.getComparison();
      return successResponse(res, comparison, 'Attribution comparison retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async recalculate(req, res, next) {
    try {
      const lookbackDays = req.body.lookbackDays ? parseInt(req.body.lookbackDays, 10) : 60;
      const result = await attributionService.recalculate({ lookbackDays });
      return successResponse(res, result, 'Attribution successfully recalculated.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttributionController();
