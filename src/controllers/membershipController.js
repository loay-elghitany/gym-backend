const Membership = require("../models/Membership");

/**
 * Membership Controller
 * Handles membership plans for each tenant
 */

// @route   GET /api/memberships
// @desc    Get all active membership plans for current tenant
// @access  Private
exports.getAllMemberships = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // CRITICAL: Filter by tenant to ensure data isolation
    const memberships = await Membership.find({
      tenantId: req.tenant._id,
      isActive: true,
    })
      .sort({ displayOrder: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Membership.countDocuments({
      tenantId: req.tenant._id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        memberships,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GetAllMemberships Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching memberships",
      error: error.message,
    });
  }
};

// @route   GET /api/memberships/:id
// @desc    Get a specific membership plan
// @access  Private
exports.getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id, // Ensure membership belongs to current tenant
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error("GetMembershipById Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching membership",
      error: error.message,
    });
  }
};

// @route   POST /api/memberships
// @desc    Create a new membership plan
// @access  Private (GymOwner)
exports.createMembership = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      duration,
      durationUnit,
      features,
      billingCycle,
    } = req.body;

    // Validate input
    if (!name || price === undefined || !duration || !durationUnit) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, price, duration, and durationUnit",
      });
    }

    const newMembership = new Membership({
      name,
      description,
      price,
      currency: currency || "USD",
      duration,
      durationUnit,
      features: features || [],
      billingCycle: billingCycle || "monthly",
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
    });

    await newMembership.save();

    res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      data: newMembership,
    });
  } catch (error) {
    console.error("CreateMembership Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating membership",
      error: error.message,
    });
  }
};

// @route   PUT /api/memberships/:id
// @desc    Update a membership plan
// @access  Private (GymOwner)
exports.updateMembership = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      durationUnit,
      features,
      isActive,
      displayOrder,
    } = req.body;

    // Find and update membership - CRITICAL: Verify tenant match
    const membership = await Membership.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
      },
      {
        name: name || undefined,
        description: description || undefined,
        price: price !== undefined ? price : undefined,
        duration: duration || undefined,
        durationUnit: durationUnit || undefined,
        features: features || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
      },
      { new: true, runValidators: true },
    );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found in this tenant",
      });
    }

    res.status(200).json({
      success: true,
      message: "Membership plan updated successfully",
      data: membership,
    });
  } catch (error) {
    console.error("UpdateMembership Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating membership",
      error: error.message,
    });
  }
};

// @route   DELETE /api/memberships/:id
// @desc    Delete a membership plan (soft delete by marking inactive)
// @access  Private (GymOwner)
exports.deleteMembership = async (req, res) => {
  try {
    // Soft delete - mark as inactive
    const membership = await Membership.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
      },
      { isActive: false },
      { new: true },
    );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found in this tenant",
      });
    }

    res.status(200).json({
      success: true,
      message: "Membership plan deleted successfully",
      data: membership,
    });
  } catch (error) {
    console.error("DeleteMembership Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting membership",
      error: error.message,
    });
  }
};
