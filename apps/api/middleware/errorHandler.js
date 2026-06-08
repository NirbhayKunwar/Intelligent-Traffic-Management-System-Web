import { logger } from "./logger.js";

const isProduction = process.env.NODE_ENV === "production";

export function errorHandler(err, req, res, next) {
  // Log full error stack in Winston
  logger.error(err.message, { 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Determine status code (default to 500 Server Error)
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || "An unexpected error occurred.",
    ...(isProduction ? {} : { stack: err.stack })
  });
}
