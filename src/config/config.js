/**
 * Application Configuration
 * Centralized configuration for the application
 */

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const mongodbUri =
  process.env.MONGODB_URI ||
  (!isProduction ? "mongodb://localhost:27017/gym-backend" : undefined);
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && !mongodbUri) {
  throw new Error("MONGODB_URI is required in production but was not provided");
}

if (isProduction && !jwtSecret) {
  throw new Error("JWT_SECRET is required in production but was not provided");
}

const config = {
  port: process.env.PORT || 5000,
  nodeEnv,

  // Database
  mongodbUri,

  // JWT
  jwtSecret,
  jwtExpire: process.env.JWT_EXPIRE || "7d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : isProduction
      ? []
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:5173",
        ],

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
  },

  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },

  // Response messages
  messages: {
    success: "Operation completed successfully",
    error: "An error occurred",
    unauthorized: "Unauthorized access",
    forbidden: "Forbidden",
    notFound: "Resource not found",
  },
};

module.exports = config;
