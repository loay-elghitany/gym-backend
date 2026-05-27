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
