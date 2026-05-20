require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/database");
const config = require("./src/config/config");
const { errorHandler } = require("./src/config/errorHandler");

// Import middleware
const tenantMiddleware = require("./src/middleware/tenantMiddleware");
const { authMiddleware } = require("./src/middleware/authMiddleware");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const membershipRoutes = require("./src/routes/membershipRoutes");
const smartTemplateRoutes = require("./src/routes/smartTemplateRoutes");
const churnRoutes = require("./src/routes/churnRoutes");
const planRoutes = require("./src/routes/planRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const challengeRoutes = require("./src/routes/challengeRoutes");
const walletRoutes = require("./src/routes/walletRoutes");
const workoutLogRoutes = require("./src/routes/workoutLogRoutes");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Allow explicit origins from config
      if (
        Array.isArray(config.corsOrigin) &&
        config.corsOrigin.includes(origin)
      ) {
        return callback(null, true);
      }

      // Allow dynamic subdomains of localhost on port 5173, e.g. http://power-gym.localhost:5173
      try {
        const url = new URL(origin);
        const host = url.host; // e.g. power-gym.localhost:5173
        if (host === "localhost:5173" || host.endsWith(".localhost:5173")) {
          return callback(null, true);
        }
      } catch (err) {
        // fallthrough to deny
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-tenant-slug",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: ["Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request debug logging middleware
app.use((req, res, next) => {
  try {
    const now = new Date().toISOString();
    const origin = req.headers.origin || "none";
    const tenant = req.headers["x-tenant-slug"] || "none";
    const hasAuth = req.headers.authorization ? "yes" : "no";
    console.log(
      `[Request] ${now} ${req.method} ${req.originalUrl} Origin:${origin} Tenant:${tenant} Auth:${hasAuth}`,
    );
  } catch (err) {
    // non-fatal logging error
    console.error("Request logger error", err);
  }
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// All tenant-specific routes require tenant middleware
app.use("/api/auth", tenantMiddleware, authRoutes);
app.use("/api/users", tenantMiddleware, userRoutes);
app.use("/api/memberships", tenantMiddleware, membershipRoutes);
app.use("/api/templates", tenantMiddleware, smartTemplateRoutes);
app.use("/api/churn-radar", tenantMiddleware, churnRoutes);
app.use("/api/plans", tenantMiddleware, planRoutes);
app.use("/api/attendance", tenantMiddleware, attendanceRoutes);
app.use("/api/subscriptions", tenantMiddleware, subscriptionRoutes);
app.use("/api/owner/metrics", tenantMiddleware, analyticsRoutes);
app.use("/api/challenges", tenantMiddleware, challengeRoutes);
app.use("/api/wallet", tenantMiddleware, authMiddleware, walletRoutes);
app.use("/api/workoutlogs", tenantMiddleware, workoutLogRoutes);

// Admin/Superadmin routes can be added here
// app.use('/api/admin', adminRoutes);
// app.use('/api/tenants', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     Gym Management SaaS Backend Server                 ║
║     Server running on port: ${PORT}                        ║
║     Environment: ${config.nodeEnv}                         ║
║     Database: ${config.mongodbUri}                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`✗ Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`✗ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("✓ SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✓ HTTP server closed");
    process.exit(0);
  });
});

module.exports = app;
