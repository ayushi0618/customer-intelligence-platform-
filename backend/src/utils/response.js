/**
 * Standardized API Response Utilities
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

function successResponse(res, data = {}, message = 'Operation completed successfully', statusCode = 200, meta = null) {
  const payload = {
    success: true,
    data,
    message
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

function paginatedResponse(res, data = [], page = 1, limit = 25, total = 0, message = 'Data retrieved successfully') {
  const totalPages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    success: true,
    data,
    message,
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: parseInt(total, 10),
      totalPages
    }
  });
}

function errorResponse(res, message = 'Internal Server Error', statusCode = 500, code = 'INTERNAL_ERROR', details = []) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
}

module.exports = {
  successResponse,
  paginatedResponse,
  errorResponse
};
