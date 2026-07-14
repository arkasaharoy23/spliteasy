const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} failed`, err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || "Something went wrong"
  });
}

module.exports = errorHandler;