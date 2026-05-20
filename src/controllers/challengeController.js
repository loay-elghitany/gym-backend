const Challenge = require("../models/Challenge");
const WorkoutLog = require("../models/WorkoutLog");
const User = require("../models/User");

// GET /api/challenges
exports.listChallenges = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant || {};
    const list = await Challenge.find({ tenantId, isActive: true }).sort({
      startDate: -1,
    });
    res.json({ success: true, data: { challenges: list } });
  } catch (err) {
    next(err);
  }
};

// POST /api/challenges/:id/join
exports.joinChallenge = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant || {};
    const { id } = req.params;
    const userId = req.user && req.user._id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const challenge = await Challenge.findOne({ _id: id, tenantId });
    if (!challenge)
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });

    if (
      challenge.participants.some((p) => String(p.userId) === String(userId))
    ) {
      return res.json({ success: true, data: { message: "Already joined" } });
    }

    challenge.participants.push({ userId, joinedAt: new Date() });
    await challenge.save();
    res.json({ success: true, data: { challenge } });
  } catch (err) {
    next(err);
  }
};

// GET /api/challenges/:id/leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant || {};
    const { id } = req.params;
    const challenge = await Challenge.findOne({ _id: id, tenantId });
    if (!challenge)
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });

    // For each participant, compute attendance count and total volume in challenge window
    const start = challenge.startDate;
    const end = challenge.endDate;

    const results = await Promise.all(
      challenge.participants.map(async (p) => {
        const uid = p.userId;
        const attendanceCount = await WorkoutLog.countDocuments({
          tenantId,
          userId: uid,
          sessionDate: { $gte: start, $lte: end },
        });
        const volumeAgg = await WorkoutLog.aggregate([
          {
            $match: {
              tenantId: challenge.tenantId,
              userId: uid,
              sessionDate: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: "$userId", total: { $sum: "$totalVolume" } } },
        ]);
        const totalVolume = (volumeAgg[0] && volumeAgg[0].total) || 0;
        const user = await User.findById(uid).select("name avatar");
        return { user: user || { _id: uid }, attendanceCount, totalVolume };
      }),
    );

    // Rank by attendance then volume
    results.sort(
      (a, b) =>
        b.attendanceCount - a.attendanceCount || b.totalVolume - a.totalVolume,
    );

    res.json({ success: true, data: { leaderboard: results } });
  } catch (err) {
    next(err);
  }
};
