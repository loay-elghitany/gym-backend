const MembershipPackage = require("../models/MembershipPackage");

exports.getAllPackages = async (req, res) => {
  try {
    const packages = await MembershipPackage.find({
      tenantId: req.tenant._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error("GetAllPackages Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching membership packages",
      error: error.message,
    });
  }
};

exports.getPackageById = async (req, res) => {
  try {
    const pkg = await MembershipPackage.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.status(200).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    console.error("GetPackageById Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching package",
      error: error.message,
    });
  }
};

exports.createPackage = async (req, res) => {
  try {
    const { name, price, durationInDays, sessionCount } = req.body;

    if (!name || price === undefined || durationInDays === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, price, and durationInDays",
      });
    }

    const newPackage = new MembershipPackage({
      name,
      price,
      durationInDays,
      sessionCount:
        sessionCount === undefined || sessionCount === null
          ? null
          : Number(sessionCount),
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
    });

    await newPackage.save();

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    console.error("CreatePackage Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating package",
      error: error.message,
    });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const { name, price, durationInDays, sessionCount, isActive } = req.body;

    const updatedPackage = await MembershipPackage.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
      },
      {
        name: name || undefined,
        price: price !== undefined ? price : undefined,
        durationInDays:
          durationInDays !== undefined ? durationInDays : undefined,
        sessionCount: sessionCount === undefined ? undefined : sessionCount,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      { new: true, runValidators: true },
    );

    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found for this tenant",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    console.error("UpdatePackage Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating package",
      error: error.message,
    });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const deletedPackage = await MembershipPackage.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id,
      },
      { isActive: false },
      { new: true },
    );

    if (!deletedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found for this tenant",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
      data: deletedPackage,
    });
  } catch (error) {
    console.error("DeletePackage Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting package",
      error: error.message,
    });
  }
};
