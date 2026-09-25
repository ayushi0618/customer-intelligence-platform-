/**
 * Authentication Middleware
 * Validates JWT Bearer Token and attaches user to request
 */

const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_customer_intelligence_2026_secure';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return errorResponse(res, 'Authentication token missing. Please provide Authorization header.', 401, 'UNAUTHORIZED');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return errorResponse(res, 'Invalid Authorization header format. Expected "Bearer <token>".', 401, 'INVALID_TOKEN_FORMAT');
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      }
      return errorResponse(res, 'Invalid token signature or payload.', 403, 'FORBIDDEN');
    }

    req.user = decodedUser;
    next();
  });
}

module.exports = {
  authenticateToken
};
