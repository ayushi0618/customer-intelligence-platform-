/**
 * Centralized Error Handling Middleware
 */

const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'A record with this unique identifier already exists.', 409, 'DUPLICATE_ENTRY');
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return errorResponse(res, 'Referenced parent record does not exist.', 400, 'FOREIGN_KEY_VIOLATION');
  }

  // Syntax or payload errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON payload provided.', 400, 'INVALID_JSON');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  return errorResponse(res, message, statusCode, code, err.details || []);
}

function notFoundHandler(req, res) {
  return errorResponse(res, `Route '${req.originalUrl}' not found on this server.`, 404, 'NOT_FOUND');
}

module.exports = {
  errorHandler,
  notFoundHandler
};
