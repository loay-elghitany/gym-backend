const User = require("../models/User");
const Tenant = require("../models/Tenant");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const { sendWelcomeMessage } = require("../services/telegramService");

/**
 * Auth Controller
 * Handles user authentication and authorization
 */

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user for a specific tenant
// @access  Public (but requires valid tenant)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists in this tenant
    let user = await User.findOne({
      email: normalizedEmail,
      tenantId: req.tenant._id,
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists in this tenant",
      });
    }

    // Create new user
    user = new User({
      name,
      email: normalizedEmail,
      password,
      role: role || "member",
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
    });

    // Save user
    await user.save();

    // Send optional welcome notification
    try {
      await sendWelcomeMessage(user, req.tenant);
    } catch (notificationError) {
      console.warn(
        "Telegram welcome notification failed:",
        notificationError.message,
      );
    }

    // Generate token
    const token = generateToken({ userId: user._id });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, tenantSlug: requestedTenantSlug } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedTenantSlug =
      requestedTenantSlug?.trim().toLowerCase() ||
      req.headers["x-tenant-slug"]?.trim().toLowerCase();

    // Emergency Super Admin bypass for system tenant login.
    if (requestedTenantSlug === "system" || normalizedTenantSlug === "system") {
      const adminUser = await User.findOne({ email: normalizedEmail }).select(
        "+password",
      );
      if (!adminUser) {
        return res.status(401).json({
          success: false,
          message: "Super admin not found in DB.",
        });
      }

      const isMatch = await adminUser.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials.",
        });
      }

      adminUser.lastLogin = new Date();
      await adminUser.save();

      const token = generateToken({
        userId: adminUser._id,
        role: adminUser.role,
        tenantId: adminUser.tenantId || "system",
      });

      adminUser.password = undefined;

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: adminUser,
          token,
        },
      });
    }

    let tenant = null;
    let user = null;

    if (normalizedTenantSlug) {
      // Allow explicit system tenant to bypass tenant document lookup and
      // authenticate against the superadmin user directly.
      if (normalizedTenantSlug === "system") {
        // For the system tenant, query only by email so seeded superadmin
        // records that don't include tenant fields can authenticate.
        user = await User.findOne({ email: normalizedEmail }).select(
          "+password",
        );
      } else {
        tenant = await Tenant.findOne({ slug: normalizedTenantSlug });
        if (!tenant) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        // First try to find a tenant-scoped user
        user = await User.findOne({
          email: normalizedEmail,
          tenantId: tenant._id,
        }).select("+password");

        // If not found in tenant, allow a superadmin account to authenticate
        if (!user) {
          user = await User.findOne({
            email: normalizedEmail,
            $or: [{ role: "superadmin" }, { role: "super_admin" }],
          }).select("+password");
        }
      }
    } else {
      // No tenant requested: prefer any account if present (superadmin or global)
      user = await User.findOne({
        email: normalizedEmail,
      }).select("+password");
    }

    if (!user) {
      console.warn("[Auth] Login failed: user not found", {
        email: normalizedEmail,
        tenantSlug: normalizedTenantSlug || "none",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      console.warn("[Auth] Login failed: password mismatch", {
        email: normalizedEmail,
        tenantSlug: normalizedTenantSlug || "none",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    // Generate token with role and tenant context
    const token = generateToken({
      userId: user._id,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || req.user.name,
        phone: phone || req.user.phone,
        avatar: avatar || req.user.avatar,
      },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old and new password",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    // Verify old password
    const isPasswordValid = await user.matchPassword(oldPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("ChangePassword Error:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};
