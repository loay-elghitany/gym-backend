const Plan = require("../models/Plan");
const User = require("../models/User");

const normalizeExerciseItem = (exercise) => {
  if (!exercise || typeof exercise !== "object") {
    return null;
  }

  const name = String(exercise.name || "").trim();
  if (!name) {
    return null;
  }

  return {
    name,
    sets:
      exercise.sets !== undefined && exercise.sets !== null
        ? Number(exercise.sets)
        : undefined,
    reps: exercise.reps ? String(exercise.reps).trim() : undefined,
    notes: exercise.notes ? String(exercise.notes).trim() : undefined,
    rest: exercise.rest ? String(exercise.rest).trim() : undefined,
    instruction: exercise.instruction
      ? String(exercise.instruction).trim()
      : "",
    videoUrl: exercise.videoUrl ? String(exercise.videoUrl).trim() : "",
    gifUrl: exercise.gifUrl ? String(exercise.gifUrl).trim() : "",
  };
};

const buildLegacyDay = (exercises = []) => ({
  dayName: "Legacy Plan",
  exercises,
});

const normalizeDays = (days, fallbackExercises = []) => {
  const normalizedFallback = Array.isArray(fallbackExercises)
    ? fallbackExercises.map(normalizeExerciseItem).filter(Boolean)
    : [];

  if (Array.isArray(days) && days.length) {
    const normalized = days
      .map((day, index) => {
        if (!day || typeof day !== "object") {
          return null;
        }

        const dayName = String(day.dayName || "").trim() || `Day ${index + 1}`;
        const exercises = Array.isArray(day.exercises)
          ? day.exercises.map(normalizeExerciseItem).filter(Boolean)
          : [];

        return exercises.length ? { dayName, exercises } : null;
      })
      .filter(Boolean);

    return normalized.length
      ? normalized
      : normalizedFallback.length
        ? [buildLegacyDay(normalizedFallback)]
        : [];
  }

  return normalizedFallback.length ? [buildLegacyDay(normalizedFallback)] : [];
};

const normalizeDietNotes = (dietNotes) => {
  if (!Array.isArray(dietNotes)) {
    return [];
  }

  return dietNotes
    .map((note) => {
      if (typeof note === "string") {
        return { item: note.trim(), alternatives: [] };
      }

      if (!note || typeof note !== "object") {
        return null;
      }

      return {
        item: String(note.item || note.mealName || "").trim(),
        alternatives: Array.isArray(note.alternatives) ? note.alternatives : [],
      };
    })
    .filter((item) => item && item.item);
};

const flattenDays = (days) => {
  if (!Array.isArray(days)) {
    return [];
  }

  return days.flatMap((day) =>
    Array.isArray(day.exercises)
      ? day.exercises.map(normalizeExerciseItem).filter(Boolean)
      : [],
  );
};

const normalizePlanResponse = (plan) => {
  if (!plan) {
    return plan;
  }

  const rawPlan = typeof plan.toObject === "function" ? plan.toObject() : plan;
  const baseExercises = Array.isArray(rawPlan.exercises)
    ? rawPlan.exercises.map(normalizeExerciseItem).filter(Boolean)
    : [];

  // Always prioritize days structure
  let days = normalizeDays(rawPlan.days, baseExercises);

  // If no days exist after normalization, ensure we create at least one day from exercises
  if (!days || !days.length) {
    if (baseExercises.length) {
      days = [buildLegacyDay(baseExercises)];
    } else {
      days = [];
    }
  }

  return {
    ...rawPlan,
    days,
    // Only include exercises for backward compatibility if days is empty
    exercises: days.length > 0 ? [] : baseExercises,
  };
};

// @route GET /api/plans
// Member: returns plans assigned to them
// Trainer/GymOwner: returns tenant plans (with pagination)
exports.getPlans = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    if (req.user.role === "member") {
      const plans = await Plan.find({
        tenantId: req.tenant._id,
        assignedTo: req.user._id,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email")
        .lean();

      const normalizedPlans = plans.map(normalizePlanResponse);
      return res
        .status(200)
        .json({ success: true, data: { plans: normalizedPlans } });
    }

    // For trainers and owners return paginated tenant plans
    const plans = await Plan.find({ tenantId: req.tenant._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "name email")
      .lean();

    const total = await Plan.countDocuments({ tenantId: req.tenant._id });
    const normalizedPlans = plans.map(normalizePlanResponse);

    res.status(200).json({
      success: true,
      data: {
        plans: normalizedPlans,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("GetPlans Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching plans",
      error: error.message,
    });
  }
};

// @route GET /api/plans/:id
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    }).populate("assignedTo createdBy", "name email role");
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    // If member, ensure assigned
    if (
      req.user.role === "member" &&
      !plan.assignedTo.map(String).includes(String(req.user._id))
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this plan" });
    }

    res.status(200).json({ success: true, data: normalizePlanResponse(plan) });
  } catch (error) {
    console.error("GetPlanById Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching plan",
      error: error.message,
    });
  }
};

// @route POST /api/plans
// Trainers and GymOwners can create plans and assign to members
exports.createPlan = async (req, res) => {
  try {
    const {
      title,
      description,
      days,
      exercises,
      dietNotes,
      memberIds,
      assignedTo = [],
      startDate,
      endDate,
    } = req.body;

    const targetMemberIds = Array.isArray(memberIds)
      ? memberIds
      : Array.isArray(assignedTo)
        ? assignedTo
        : [];

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    if (!targetMemberIds.length) {
      return res.status(400).json({
        success: false,
        message: "Please assign the plan to at least one member",
      });
    }

    // Validate target member IDs are users within this tenant
    const validUsers = await User.find({
      _id: { $in: targetMemberIds },
      tenantId: req.tenant._id,
      role: "member",
    }).select("_id");
    const validIds = validUsers.map((u) => u._id);

    if (!validIds.length) {
      return res.status(400).json({
        success: false,
        message: "No valid members found to assign the plan",
      });
    }

    const normalizedDietNotes = normalizeDietNotes(dietNotes);

    const normalizedExercises = Array.isArray(exercises)
      ? exercises.map(normalizeExerciseItem).filter(Boolean)
      : [];

    const normalizedDays = normalizeDays(days, normalizedExercises);

    // Validate that plan has at least some exercises
    const totalExercises = normalizedDays.reduce(
      (total, day) =>
        total + (Array.isArray(day.exercises) ? day.exercises.length : 0),
      0,
    );

    if (!totalExercises && !normalizedExercises.length) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one exercise to the plan",
      });
    }

    const flattenedExercises = flattenDays(normalizedDays);

    const planDocs = validIds.map((memberId) => ({
      title,
      description: description || "",
      exercises: flattenedExercises,
      days: normalizedDays,
      dietNotes: normalizedDietNotes,
      assignedTo: [memberId],
      createdBy: req.user._id,
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }));

    const createdPlans = await Plan.insertMany(planDocs);
    const normalizedPlans = createdPlans.map(normalizePlanResponse);

    res.status(201).json({
      success: true,
      message: `Plan assigned to ${createdPlans.length} member(s)`,
      data: { plans: normalizedPlans },
    });
  } catch (error) {
    console.error("CreatePlan Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating plan",
      error: error.message,
    });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      days,
      exercises,
      dietNotes,
      startDate,
      endDate,
      isActive,
    } = req.body;

    const updateData = {};
    if (title !== undefined) {
      updateData.title = String(title).trim();
    }
    if (description !== undefined) {
      updateData.description = String(description).trim();
    }
    if (dietNotes !== undefined) {
      updateData.dietNotes = normalizeDietNotes(dietNotes);
    }

    const normalizedExercises = Array.isArray(exercises)
      ? exercises.map(normalizeExerciseItem).filter(Boolean)
      : [];
    const normalizedDays = normalizeDays(days, normalizedExercises);

    if (days !== undefined) {
      updateData.days = normalizedDays;
      updateData.exercises = flattenDays(normalizedDays);
    } else if (exercises !== undefined) {
      updateData.exercises = normalizedExercises;
      updateData.days = normalizeDays(null, normalizedExercises);
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : undefined;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : undefined;
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const plan = await Plan.findOneAndUpdate(
      { _id: id, tenantId: req.tenant._id },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: normalizePlanResponse(plan),
    });
  } catch (error) {
    console.error("UpdatePlan Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating plan",
      error: error.message,
    });
  }
};
