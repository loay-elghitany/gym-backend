const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/config");

/**
 * Auth Middleware
 * Verifies JWT token and attaches user information to the request
 * Ensures that user has access to their tenant's resources
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please log in.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token may be invalid.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive.",
      });
    }

    if (req.tenantDocument?.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Service suspended",
      });
    }

    // CRITICAL: Verify that the user's tenant matches the request tenant
    // This prevents a user from one tenant accessing another tenant's data
    if (
      req.tenant &&
      user.tenantId.toString() !== req.tenant._id.toString() &&
      user.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. User does not belong to this tenant.",
      });
    }

    // Attach user information to the request
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
      permissions: user.permissions,
      managedTenants: user.managedTenants,
    };

    // Attach raw user document if needed
    req.userDocument = user;

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    next();
  } catch (error) {
    // Handle token expiration
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }

    // Handle token malformation
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Error during authentication",
      error: error.message,
    });
  }
};

/**
 * Role-based Access Control Middleware
 * Use this to protect routes that require specific roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Permission-based Access Control Middleware
 * Use this to protect routes that require specific permissions
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${requiredPermission}`,
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorize,
  checkPermission,
};
