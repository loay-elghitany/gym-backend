const Plan = require("../models/Plan");
const User = require("../models/User");

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
      }).sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: { plans } });
    }

    // For trainers and owners return paginated tenant plans
    const plans = await Plan.find({ tenantId: req.tenant._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "name email");

    const total = await Plan.countDocuments({ tenantId: req.tenant._id });

    res.status(200).json({
      success: true,
      data: {
        plans,
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

    res.status(200).json({ success: true, data: plan });
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
      exercises,
      dietNotes,
      assignedTo = [],
      startDate,
      endDate,
    } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    // Validate assignedTo are users within tenant
    const validUsers = await User.find({
      _id: { $in: assignedTo },
      tenantId: req.tenant._id,
    }).select("_id");
    const validIds = validUsers.map((u) => u._id);

    const normalizedDietNotes = Array.isArray(dietNotes)
      ? dietNotes.map((note) => {
          if (typeof note === "string") {
            return { item: note, alternatives: [] };
          }
          return {
            item: note.item || String(note).trim(),
            alternatives: Array.isArray(note.alternatives)
              ? note.alternatives
              : [],
          };
        })
      : [];

    const normalizedExercises = Array.isArray(exercises)
      ? exercises.map((exercise) => ({
          name: exercise.name || "",
          sets: exercise.sets,
          reps: exercise.reps,
          notes: exercise.notes,
          rest: exercise.rest,
          instruction: exercise.instruction || "",
          videoUrl: exercise.videoUrl || "",
        }))
      : [];

    const newPlan = new Plan({
      title,
      description: description || "",
      exercises: normalizedExercises,
      dietNotes: normalizedDietNotes,
      assignedTo: validIds,
      createdBy: req.user._id,
      tenantId: req.tenant._id,
      tenantSlug: req.tenant.slug,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    await newPlan.save();

    res
      .status(201)
      .json({ success: true, message: "Plan created", data: newPlan });
  } catch (error) {
    console.error("CreatePlan Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating plan",
      error: error.message,
    });
  }
};
