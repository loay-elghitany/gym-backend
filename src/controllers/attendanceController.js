const CheckIn = require("../models/CheckIn");
const User = require("../models/User");
const { awardPoints } = require("../services/gamificationService");

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

    const previousUser = await User.findOne({
      _id: req.user._id,
      tenantId: req.tenant._id,
    });

    const subscription = previousUser?.subscription || {};
    const subscriptionExpiry =
      subscription.expiryDate || subscription.expiresAt;
    const currentExpiryDate = subscriptionExpiry
      ? new Date(subscriptionExpiry)
      : null;
    const isExpired = currentExpiryDate ? currentExpiryDate < now : false;
    const isLimited = subscription.membershipType === "limited";

    if ((isLimited && subscription.remainingSessions <= 0) || isExpired) {
      return res.status(400).json({
        success: false,
        message: "Subscription expired or no sessions left",
      });
    }

    const remainingSessions = isLimited
      ? Math.max((subscription.remainingSessions || 0) - 1, 0)
      : subscription.remainingSessions;

    const expiresAt = new Date(now.getTime() + durationMinutes * 60000);
    const checkIn = await CheckIn.create({
      user: req.user._id,
      tenantId: req.tenant._id,
      status: "checked_in",
      checkInAt: now,
      expiresAt,
      locationType: req.body?.locationType || "gym",
    });

    const previousAttendance = previousUser?.lastAttendanceAt
      ? new Date(previousUser.lastAttendanceAt)
      : null;
    const previousStreak = previousUser?.gamification?.attendanceStreak || 0;

    let attendanceStreak = 1;
    if (previousAttendance) {
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfPrevious = new Date(previousAttendance);
      startOfPrevious.setHours(0, 0, 0, 0);
      const dayDifference = Math.round(
        (startOfToday.getTime() - startOfPrevious.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (dayDifference === 1) {
        attendanceStreak = previousStreak + 1;
      } else if (dayDifference === 0) {
        attendanceStreak = previousStreak || 1;
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, tenantId: req.tenant._id },
      {
        $set: {
          lastAttendanceAt: now,
          "gamification.attendanceStreak": attendanceStreak,
          ...(isLimited && {
            "subscription.remainingSessions": remainingSessions,
            "subscription.status":
              remainingSessions === 0 ? "expired" : subscription.status,
          }),
        },
        $push: {
          attendanceHistory: {
            date: now,
            checkInType: req.body?.locationType || "gym",
          },
        },
      },
      { new: true },
    );

    const awardedUser = await awardPoints(
      req.user._id,
      req.tenant._id,
      10,
      "Attendance check-in",
      { attendanceStreak },
    );

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentCheckins = await CheckIn.countDocuments({
      tenantId: req.tenant._id,
      user: req.user._id,
      checkInAt: { $gte: weekAgo },
    });

    const consistencyBadge = {
      name: "Consistency Badge",
      description: "Awarded for checking in five times in a single week",
      awardedAt: now,
    };

    const hasConsistencyBadge =
      awardedUser.gamification?.badges?.some(
        (badge) => badge.name === consistencyBadge.name,
      ) ||
      awardedUser.badges?.some((badge) => badge.name === consistencyBadge.name);

    let finalUser = awardedUser;
    if (recentCheckins >= 5 && !hasConsistencyBadge) {
      finalUser = await awardPoints(
        req.user._id,
        req.tenant._id,
        50,
        "Weekly consistency bonus",
      );

      finalUser.gamification = finalUser.gamification || {};
      finalUser.badges = finalUser.badges || [];
      if (
        !finalUser.gamification.badges.some(
          (badge) => badge.name === consistencyBadge.name,
        )
      ) {
        finalUser.gamification.badges.push(consistencyBadge);
      }
      if (
        !finalUser.badges.some((badge) => badge.name === consistencyBadge.name)
      ) {
        finalUser.badges.push(consistencyBadge);
      }
      await finalUser.save();
    }

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
        user: finalUser,
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
