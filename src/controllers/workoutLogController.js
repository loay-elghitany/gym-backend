const WorkoutLog = require("../models/WorkoutLog");

// GET /api/workoutlogs?userId=...
exports.getLogs = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant || {};
    const userId = req.query.userId || (req.user && req.user._id);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "userId required" });

    const logs = await WorkoutLog.find({ tenantId, userId })
      .sort({ sessionDate: -1 })
      .limit(100);
    res.json({ success: true, data: { logs } });
  } catch (err) {
    next(err);
  }
};
