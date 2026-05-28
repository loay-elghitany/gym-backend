const { getLeaderboard } = require("../services/gamificationService");
const InBodyRecord = require("../models/InBodyRecord");
const User = require("../models/User");

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(req.tenant._id, 20);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("MemberLeaderboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching member leaderboard",
      error: error.message,
    });
  }
};

exports.getMyInBodyRecords = async (req, res) => {
  try {
    const records = await InBodyRecord.find({
      memberId: req.user._id,
      tenantId: req.tenant._id,
    }).sort({ date: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("MemberInBodyRecords Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching member InBody records",
      error: error.message,
    });
  }
};

// Get expiring members (for gym owner dashboard)
exports.getExpiringMembers = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { days = 7 } = req.query;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const expiringMembers = await User.find({
      tenantId,
      role: "member",
      "subscription.status": "active",
      "subscription.expiryDate": {
        $lte: expiryDate,
        $gte: new Date(),
      },
    })
      .select("name email phone subscription")
      .sort({ "subscription.expiryDate": 1 });

    res.status(200).json({
      success: true,
      data: expiringMembers,
      count: expiringMembers.length,
    });
  } catch (error) {
    console.error("Error fetching expiring members:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch expiring members",
    });
  }
};

// Upload progress photos
exports.uploadProgressPhoto = async (req, res) => {
  try {
    const { photoUrl, viewType = "front" } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: "Photo URL is required",
      });
    }

    if (!["front", "back", "side", "other"].includes(viewType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid view type",
      });
    }

    const progressPhoto = {
      date: new Date(),
      photoUrl: photoUrl.trim(),
      viewType,
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { progressPhotos: progressPhoto } },
      { new: true },
    ).select("progressPhotos");

    res.status(201).json({
      success: true,
      message: "Progress photo uploaded successfully",
      data: user.progressPhotos,
    });
  } catch (error) {
    console.error("UploadProgressPhoto Error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading progress photo",
      error: error.message,
    });
  }
};

// Get my progress photos
exports.getMyProgressPhotos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("progressPhotos");

    res.status(200).json({
      success: true,
      data: user?.progressPhotos || [],
    });
  } catch (error) {
    console.error("GetMyProgressPhotos Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress photos",
      error: error.message,
    });
  }
};

// Delete progress photo
exports.deleteProgressPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { progressPhotos: { _id: photoId } } },
      { new: true },
    ).select("progressPhotos");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Progress photo deleted successfully",
      data: user.progressPhotos,
    });
  } catch (error) {
    console.error("DeleteProgressPhoto Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting progress photo",
      error: error.message,
    });
  }
};

// Upload InBody record (member self-upload)
exports.uploadInBodyRecord = async (req, res) => {
  try {
    const { weight, fatPercentage, muscleMass, fileUrl } = req.body;

    if (weight === undefined || weight === null) {
      return res.status(400).json({
        success: false,
        message: "Weight is required",
      });
    }

    const inBodyRecord = {
      date: new Date(),
      weight: Number(weight),
      fatPercentage:
        fatPercentage !== undefined && fatPercentage !== null
          ? Number(fatPercentage)
          : null,
      muscleMass:
        muscleMass !== undefined && muscleMass !== null
          ? Number(muscleMass)
          : null,
      fileUrl: fileUrl ? fileUrl.trim() : null,
      uploadedBy: "member",
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { inBodyRecords: inBodyRecord } },
      { new: true },
    ).select("inBodyRecords");

    res.status(201).json({
      success: true,
      message: "InBody record uploaded successfully",
      data: user.inBodyRecords,
    });
  } catch (error) {
    console.error("UploadInBodyRecord Error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading InBody record",
      error: error.message,
    });
  }
};

// Get my InBody records (including self-uploaded)
exports.getMyInBodyRecordsExtended = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("inBodyRecords");

    res.status(200).json({
      success: true,
      data: user?.inBodyRecords || [],
    });
  } catch (error) {
    console.error("GetMyInBodyRecordsExtended Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching InBody records",
      error: error.message,
    });
  }
};

// Get member progress (for trainers)
exports.getMemberProgress = async (req, res) => {
  try {
    const { memberId } = req.params;

    const user = await User.findById(memberId).select(
      "name progressPhotos inBodyRecords",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        progressPhotos: user.progressPhotos || [],
        inBodyRecords: user.inBodyRecords || [],
      },
    });
  } catch (error) {
    console.error("GetMemberProgress Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching member progress",
      error: error.message,
    });
  }
};
