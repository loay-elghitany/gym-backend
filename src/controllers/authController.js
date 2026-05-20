const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendWelcomeMessage } = require("../services/telegramService");

/**
 * Auth Controller
 * Handles user authentication and authorization
 */

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRE || "7d",
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
    const token = generateToken(user._id);

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
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("[Auth] Login attempt", {
      tenantSlug: req.tenant ? req.tenant.slug : "none",
      email: normalizedEmail,
      route: req.originalUrl,
    });

    // Find user in this tenant only
    const user = await User.findOne({
      email: normalizedEmail,
      tenantId: req.tenant._id,
    }).select("+password");

    if (!user) {
      console.warn("[Auth] Login failed: user not found", {
        email: normalizedEmail,
        tenantSlug: req.tenant.slug,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      console.warn("[Auth] Login failed: password mismatch", {
        email: normalizedEmail,
        tenantSlug: req.tenant.slug,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    // Generate token with role and tenant context
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        tenantId: user.tenantId,
      },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: process.env.JWT_EXPIRE || "7d",
      },
    );

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
    const user = await User.findById(req.user._id);

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
