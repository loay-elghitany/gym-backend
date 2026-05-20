/**
 * Response Formatter Utility
 * Standardize API responses
 */

const sendSuccess = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error && { error }),
  });
};

const sendPaginatedResponse = (res, statusCode, message, data, pagination) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
};
