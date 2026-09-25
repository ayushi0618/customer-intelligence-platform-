/**
 * Campaign Controller
 */

const campaignRepository = require('../repositories/campaign.repository');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');

class CampaignController {
  async list(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const { channel, status } = req.query;

      const result = await campaignRepository.findAll({ page, limit, channel, status });
      return paginatedResponse(res, result.campaigns, result.page, result.limit, result.total, 'Campaigns retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const campaign = await campaignRepository.findById(req.params.id);
      if (!campaign) {
        return errorResponse(res, `Campaign with ID ${req.params.id} not found.`, 404, 'CAMPAIGN_NOT_FOUND');
      }
      return successResponse(res, campaign, 'Campaign details retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CampaignController();
