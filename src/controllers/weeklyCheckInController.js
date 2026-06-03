const WeeklyCheckIn = require("../models/WeeklyCheckIn");
const User = require("../models/User");
const {
  isValidCloudinaryUrl,
  normalizeCloudinaryUrl,
} = require("../utils/cloudinaryValidator");

// Create a weekly check-in (Trainee)
exports.createWeeklyCheckIn = async (req, res, next) => {
  try {
    const traineeId = req.user.id || req.user._id || req.user.traineeId;
    // Accept unified payload: { currentWeight, fatigueLevel, notes, photos, inBody, trainerId }
    const { currentWeight, fatigueLevel, notes, photos, inBody, trainerId } =
      req.body;

    // Find the trainee's tenant
    const trainee = await User.findById(traineeId);
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: "Trainee not found",
      });
    }

    // Trainer is optional. If provided, validate it belongs to same tenant.
    let assignedTrainerId = trainerId || null;
    if (assignedTrainerId) {
      const trainer = await User.findById(assignedTrainerId);
      if (
        !trainer ||
        trainer.tenantId.toString() !== trainee.tenantId.toString()
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid trainer" });
      }
    }

    // Check if check-in already exists for this week
    const date = new Date();
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7,
    );
    const year = date.getFullYear();

    const existingCheckIn = await WeeklyCheckIn.findOne({
      traineeId,
      weekNumber,
      year,
    });

    if (existingCheckIn) {
      // Update existing check-in
      existingCheckIn.currentWeight =
        currentWeight || existingCheckIn.currentWeight;
      existingCheckIn.fatigueLevel =
        fatigueLevel || existingCheckIn.fatigueLevel;
      existingCheckIn.notes = notes || existingCheckIn.notes;
      if (assignedTrainerId) {
        existingCheckIn.trainerId = assignedTrainerId;
      }
      if (photos && photos.length > 0) {
        // Normalize photos to objects { url, viewType, uploadedAt } and validate Cloudinary URLs
        existingCheckIn.photos = photos
          .map((p) => {
            if (!p) return null;
            if (typeof p === "string") {
              const su = normalizeCloudinaryUrl(p);
              if (!isValidCloudinaryUrl(su)) return null;
              return { url: su, viewType: "front", uploadedAt: new Date() };
            }
            // support frontend shape { photoUrl, viewType }
            if (p.photoUrl || p.url) {
              const su = normalizeCloudinaryUrl(p.photoUrl || p.url);
              if (!isValidCloudinaryUrl(su)) return null;
              return {
                url: su,
                viewType: p.viewType || p.view || "front",
                uploadedAt: p.uploadedAt ? new Date(p.uploadedAt) : new Date(),
              };
            }
            return null;
          })
          .filter(Boolean);
      }
      await existingCheckIn.save();

      // If an inBody payload is provided, also save it to the user's inBodyRecords
      if (inBody && (inBody.weight !== undefined || inBody.fileUrl)) {
        try {
          const safeFileUrl = inBody.fileUrl || null;
          const inBodyRecord = {
            date: new Date(),
            weight: inBody.weight !== undefined ? Number(inBody.weight) : null,
            fatPercentage:
              inBody.fatPercentage !== undefined &&
              inBody.fatPercentage !== null
                ? Number(inBody.fatPercentage)
                : null,
            muscleMass:
              inBody.muscleMass !== undefined && inBody.muscleMass !== null
                ? Number(inBody.muscleMass)
                : null,
            fileUrl: safeFileUrl,
            uploadedBy: "member",
          };
          await User.findByIdAndUpdate(traineeId, {
            $push: { inBodyRecords: inBodyRecord },
          });
        } catch (err) {
          console.error("Failed to save inBody record:", err);
        }
      }
      return res.status(200).json({
        success: true,
        message: "Weekly check-in updated successfully",
        data: existingCheckIn,
      });
    }

    // Create new check-in
    const normalizedPhotos = Array.isArray(photos)
      ? photos
          .map((p) => {
            if (!p) return null;
            if (typeof p === "string") {
              const su = normalizeCloudinaryUrl(p);
              if (!isValidCloudinaryUrl(su)) return null;
              return { url: su, viewType: "front", uploadedAt: new Date() };
            }
            if (p.photoUrl || p.url) {
              const su = normalizeCloudinaryUrl(p.photoUrl || p.url);
              if (!isValidCloudinaryUrl(su)) return null;
              return {
                url: su,
                viewType: p.viewType || p.view || "front",
                uploadedAt: p.uploadedAt ? new Date(p.uploadedAt) : new Date(),
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    const checkIn = await WeeklyCheckIn.create({
      traineeId,
      trainerId: assignedTrainerId,
      tenantId: trainee.tenantId,
      tenantSlug: trainee.tenantSlug,
      currentWeight,
      fatigueLevel,
      notes,
      photos: normalizedPhotos,
      weekNumber,
      year,
    });

    // If an inBody payload is provided, also add it to the user's inBodyRecords
    if (inBody && (inBody.weight !== undefined || inBody.fileUrl)) {
      try {
        const safeFileUrl = inBody.fileUrl || null;
        const inBodyRecord = {
          date: new Date(),
          weight: inBody.weight !== undefined ? Number(inBody.weight) : null,
          fatPercentage:
            inBody.fatPercentage !== undefined && inBody.fatPercentage !== null
              ? Number(inBody.fatPercentage)
              : null,
          muscleMass:
            inBody.muscleMass !== undefined && inBody.muscleMass !== null
              ? Number(inBody.muscleMass)
              : null,
          fileUrl: safeFileUrl,
          uploadedBy: "member",
        };
        await User.findByIdAndUpdate(traineeId, {
          $push: { inBodyRecords: inBodyRecord },
        });
      } catch (err) {
        console.error("Failed to save inBody record:", err);
      }
    }

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
exports.getTraineeCheckIns = async (req, res, next) => {
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
exports.getMyCheckIns = async (req, res, next) => {
  try {
    const traineeId = req.user.id || req.user._id || req.user.traineeId;

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
exports.addTrainerFeedback = async (req, res, next) => {
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
