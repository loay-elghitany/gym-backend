const WorkoutLog = require("../models/WorkoutLog");
const Plan = require("../models/Plan");

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

exports.logWorkout = async (req, res, next) => {
  try {
    const { templateId, completedAt } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "templateId is required",
      });
    }

    const sessionDate = completedAt ? new Date(completedAt) : new Date();
    if (Number.isNaN(sessionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "completedAt must be a valid ISO timestamp",
      });
    }

    const assignedPlan = await Plan.findOne({
      _id: templateId,
      tenantId: req.tenant._id,
      assignedTo: req.user._id,
      isActive: true,
    });

    if (!assignedPlan) {
      return res.status(404).json({
        success: false,
        message: "Assigned plan not found",
      });
    }

    const exercises = (
      Array.isArray(assignedPlan.exercises) ? assignedPlan.exercises : []
    ).map((exercise) => ({
      name: exercise.name || "",
      sets: Number(exercise.sets) || 0,
      reps: Number(exercise.reps) || 0,
      notes: exercise.notes || "",
    }));

    const log = await WorkoutLog.create({
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
      userId: req.user._id,
      sessionDate,
      exercises,
      meta: {
        templateId,
        source: "member-dashboard",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Workout saved successfully",
      data: {
        logId: log._id,
      },
    });
  } catch (error) {
    next(error);
  }
};
