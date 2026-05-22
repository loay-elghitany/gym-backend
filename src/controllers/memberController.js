const { getLeaderboard } = require("../services/gamificationService");
const InBodyRecord = require("../models/InBodyRecord");

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
