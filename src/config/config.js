/**
 * Application Configuration
 * Centralized configuration for the application
 */

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/gym-backend",

  // JWT
  jwtSecret:
    process.env.JWT_SECRET || "your-super-secret-key-change-in-production",
  jwtExpire: process.env.JWT_EXPIRE || "7d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
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
