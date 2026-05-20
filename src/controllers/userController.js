const User = require("../models/User");

/**
 * User Controller
 * Handles user management within a tenant
 */

// @route   GET /api/users
// @desc    Get all users in current tenant
// @access  Private (GymOwner, Receptionist)
exports.getAllUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search;

    // Build filter - CRITICAL: Always filter by tenantId for data isolation
    const filter = {
      tenantId: req.tenant._id,
    };

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users and sort newest first so fresh users are visible immediately
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password");

    // Get total count
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GetAllUsers Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @route   GET /api/users/:id
// @desc    Get a specific user in current tenant
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id, // Ensure user belongs to current tenant
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GetUserById Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// @route   PUT /api/users/:id/health-profile
// @desc    Update member health profile entries
// @access  Private (Trainer, GymOwner, Member self)
exports.updateHealthProfile = async (req, res) => {
  try {
    const { inBodyEntry, note } = req.body;
    const targetUserId = req.params.id;

    if (
      req.user.role === "member" &&
      req.user._id.toString() !== targetUserId
    ) {
      return res.status(403).json({
        success: false,
        message: "Members can only update their own health profile",
      });
    }

    const user = await User.findOne({
      _id: targetUserId,
      tenantId: req.tenant._id,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!inBodyEntry || typeof inBodyEntry !== "object") {
      return res.status(400).json({
        success: false,
        message: "Please provide an inBodyEntry object",
      });
    }

    const parsedEntry = {
      date: inBodyEntry.date ? new Date(inBodyEntry.date) : new Date(),
      weight: Number(inBodyEntry.weight) || 0,
      bodyFatPercentage: inBodyEntry.bodyFatPercentage
        ? Number(inBodyEntry.bodyFatPercentage)
        : undefined,
      muscleMass: inBodyEntry.muscleMass
        ? Number(inBodyEntry.muscleMass)
        : undefined,
      visceralFat: inBodyEntry.visceralFat
        ? Number(inBodyEntry.visceralFat)
        : undefined,
      bodyWaterPercentage: inBodyEntry.bodyWaterPercentage
        ? Number(inBodyEntry.bodyWaterPercentage)
        : undefined,
      note: note || "",
    };

    user.healthProfile = user.healthProfile || {};
    user.healthProfile.inBodyHistory = user.healthProfile.inBodyHistory || [];
    user.healthProfile.inBodyHistory.unshift(parsedEntry);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Health profile updated",
      data: user.healthProfile,
    });
  } catch (error) {
    console.error("UpdateHealthProfile Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating health profile",
      error: error.message,
    });
  }
};

// @route   POST /api/users
// @desc    Create a new user in current tenant
// @access  Private (GymOwner)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = role ? role.toLowerCase() : "member";

    // Validate input
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    if (!["member", "trainer"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'member' or 'trainer'",
      });
    }

    // Check if user already exists in this tenant
    const existingUser = await User.findOne({
      email: normalizedEmail,
      tenantId: req.tenant._id,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists in this tenant",
      });
    }

    // Create new user linked to the owner tenant
    const newUser = new User({
      name,
      email,
      password,
      role: normalizedRole,
      phone,
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("CreateUser Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

// @route   PUT /api/users/:id
// @desc    Update a user in current tenant
// @access  Private (GymOwner)
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, role, isActive } = req.body;

    // Find and update user - CRITICAL: Verify tenant match
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
      },
      {
        name: name || undefined,
        phone: phone || undefined,
        role: role || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this tenant",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("UpdateUser Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// @route   DELETE /api/users/:id
// @desc    Delete a user in current tenant
// @access  Private (GymOwner)
exports.deleteUser = async (req, res) => {
  try {
    // Delete user - CRITICAL: Verify tenant match
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this tenant",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    console.error("DeleteUser Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};
