const WeeklyCheckIn = require("../models/WeeklyCheckIn");
const User = require("../models/User");

// Create a weekly check-in (Trainee)
exports.createWeeklyCheckIn = async (req, res) => {
  try {
    const { traineeId } = req.user;
    const { currentWeight, fatigueLevel, notes, photos, trainerId } = req.body;

    // Find the trainee's tenant
    const trainee = await User.findById(traineeId);
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: "Trainee not found",
      });
    }

    // If trainerId is not provided, use the trainee's assigned trainer
    let assignedTrainerId = trainerId;
    if (!assignedTrainerId) {
      // You might need to add a trainerId field to User schema or find another way
      // For now, we'll require trainerId in the request
      return res.status(400).json({
        success: false,
        message: "Trainer ID is required",
      });
    }

    // Verify trainer exists and belongs to same tenant
    const trainer = await User.findById(assignedTrainerId);
    if (!trainer || trainer.tenantId.toString() !== trainee.tenantId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid trainer",
      });
    }

    // Check if check-in already exists for this week
    const date = new Date();
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    const year = date.getFullYear();

    const existingCheckIn = await WeeklyCheckIn.findOne({
      traineeId,
      weekNumber,
      year,
    });

    if (existingCheckIn) {
      // Update existing check-in
      existingCheckIn.currentWeight = currentWeight || existingCheckIn.currentWeight;
      existingCheckIn.fatigueLevel = fatigueLevel || existingCheckIn.fatigueLevel;
      existingCheckIn.notes = notes || existingCheckIn.notes;
      if (photos && photos.length > 0) {
        existingCheckIn.photos = photos;
      }
      await existingCheckIn.save();
      return res.status(200).json({
        success: true,
        message: "Weekly check-in updated successfully",
        data: existingCheckIn,
      });
    }

    // Create new check-in
    const checkIn = await WeeklyCheckIn.create({
      traineeId,
      trainerId: assignedTrainerId,
      tenantId: trainee.tenantId,
      tenantSlug: trainee.tenantSlug,
      currentWeight,
      fatigueLevel,
      notes,
      photos,
      weekNumber,
      year,
    });

    res.status(201).json({
      success: true,
      message: "Weekly check-in created successfully",
      data: checkIn,
    });
  } catch (error) {
    console.error("Error creating weekly check-in:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create weekly check-in",
    });
  }
};

// Get check-ins for a specific trainee (Trainer)
exports.getTraineeCheckIns = async (req, res) => {
  try {
    const { traineeId } = req.params;
    const { tenantId } = req.user;

    // Verify trainee belongs to the same tenant
    const trainee = await User.findOne({ _id: traineeId, tenantId });
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: "Trainee not found",
      });
    }

    const checkIns = await WeeklyCheckIn.find({ traineeId, tenantId })
      .sort({ createdAt: -1 })
      .populate("traineeId", "name email avatar")
      .populate("trainerId", "name email avatar");

    res.status(200).json({
      success: true,
      data: checkIns,
    });
  } catch (error) {
    console.error("Error fetching trainee check-ins:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch check-ins",
    });
  }
};

// Get own check-ins (Trainee)
exports.getMyCheckIns = async (req, res) => {
  try {
    const { traineeId } = req.user;

    const checkIns = await WeeklyCheckIn.find({ traineeId })
      .sort({ createdAt: -1 })
      .populate("trainerId", "name email avatar");

    res.status(200).json({
      success: true,
      data: checkIns,
    });
  } catch (error) {
    console.error("Error fetching my check-ins:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch check-ins",
    });
  }
};

// Add trainer feedback
exports.addTrainerFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const { userId, tenantId } = req.user;

    const checkIn = await WeeklyCheckIn.findOne({ _id: id, tenantId });
    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: "Check-in not found",
      });
    }

    checkIn.trainerFeedback = feedback;
    checkIn.trainerReviewedAt = new Date();
    await checkIn.save();

    res.status(200).json({
      success: true,
      message: "Trainer feedback added successfully",
      data: checkIn,
    });
  } catch (error) {
    console.error("Error adding trainer feedback:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add feedback",
    });
  }
};
