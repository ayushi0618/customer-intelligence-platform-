/**
 * Authentication Controller
 */

const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      return successResponse(res, result, 'Authentication successful.');
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return successResponse(res, user, 'Current user profile retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
