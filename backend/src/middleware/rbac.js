/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role permissions on protected routes
 */

const { errorResponse } = require('../utils/response');

/**
 * Checks if the authenticated user has at least one of the allowed roles.
 * @param {string[]} allowedRoles - Array of allowed role names (e.g. ['Admin', 'Marketing Manager'])
 */
function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking permissions.', 401, 'UNAUTHORIZED');
    }

    const userRoles = req.user.roles || [];
    
    // Admin always has bypass access
    if (userRoles.includes('Admin')) {
      return next();
    }

    const hasPermission = allowedRoles.some(role => userRoles.includes(role));
    if (!hasPermission) {
      return errorResponse(
        res,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Your roles: [${userRoles.join(', ')}].`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

module.exports = {
  requireRoles
};
