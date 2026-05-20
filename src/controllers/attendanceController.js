const CheckIn = require("../models/CheckIn");
const User = require("../models/User");

exports.checkIn = async (req, res) => {
  try {
    const durationMinutes = Math.min(
      Math.max(Number(req.body?.durationMinutes) || 90, 1),
      90,
    );
    const now = new Date();
    const activeExists = await CheckIn.findOne({
      tenantId: req.tenant._id,
      user: req.user._id,
      status: "checked_in",
      expiresAt: { $gt: now },
    });

    if (activeExists) {
      return res.status(400).json({
        success: false,
        message: "You already have an active check-in",
      });
    }

    const expiresAt = new Date(now.getTime() + durationMinutes * 60000);
    const checkIn = await CheckIn.create({
      user: req.user._id,
      tenantId: req.tenant._id,
      status: "checked_in",
      checkInAt: now,
      expiresAt,
      locationType: req.body?.locationType || "gym",
    });

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, tenantId: req.tenant._id },
      {
        $set: { lastAttendanceAt: now },
        $push: {
          attendanceHistory: {
            date: now,
            checkInType: req.body?.locationType || "gym",
          },
        },
      },
      { new: true },
    );

    const activeCount = await CheckIn.countDocuments({
      tenantId: req.tenant._id,
      status: "checked_in",
      expiresAt: { $gt: new Date() },
    });

    res.status(201).json({
      success: true,
      data: {
        checkIn,
        activeOccupancy: activeCount,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("CheckIn Error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating check-in",
      error: error.message,
    });
  }
};

exports.getPeakHours = async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeOccupancy = await CheckIn.countDocuments({
      tenantId: req.tenant._id,
      status: "checked_in",
      expiresAt: { $gt: now },
    });

    const peakHours = await CheckIn.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          createdAt: { $gte: weekAgo },
        },
      },
      {
        $project: {
          hour: { $hour: "$checkInAt" },
        },
      },
      {
        $group: {
          _id: "$hour",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const hourMap = new Map();
    peakHours.forEach((item) => hourMap.set(item._id, item.count));

    const hourlyData = Array.from({ length: 24 }, (_, index) => ({
      hour: index,
      count: hourMap.get(index) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        activeOccupancy,
        peakHours: hourlyData,
      },
    });
  } catch (error) {
    console.error("GetPeakHours Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance metrics",
      error: error.message,
    });
  }
};
