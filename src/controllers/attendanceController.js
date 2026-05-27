const mongoose = require("mongoose");
const CheckIn = require("../models/CheckIn");
const User = require("../models/User");
const { awardPoints } = require("../services/gamificationService");

const calculateAttendanceStreak = (previousAttendance, previousStreak, now) => {
  if (!previousAttendance) {
    return 1;
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfPrevious = new Date(previousAttendance);
  startOfPrevious.setHours(0, 0, 0, 0);

  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfPrevious.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (dayDifference === 1) {
    return previousStreak + 1;
  }

  if (dayDifference === 0) {
    return previousStreak || 1;
  }

  return 1;
};

const parseScanPayload = (payload) => {
  if (!payload) {
    throw new Error("QR payload is required");
  }

  let parsedPayload = payload;

  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      throw new Error("Invalid QR payload format");
    }
  }

  if (!parsedPayload || typeof parsedPayload !== "object") {
    throw new Error("QR payload must be a JSON object");
  }

  return parsedPayload;
};

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
    const attendanceStreak = calculateAttendanceStreak(
      previousAttendance,
      previousStreak,
      now,
    );

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

exports.scanAttendance = async (req, res) => {
  try {
    console.log('ScanAttendance request body:', JSON.stringify(req.body));
    const parsedPayload = parseScanPayload(req.body?.payload || req.body);
    console.log('ScanAttendance parsedPayload:', parsedPayload);
    const memberId = parsedPayload.memberId;
    console.log('ScanAttendance memberId raw:', memberId, 'isValid:', mongoose.Types.ObjectId.isValid(String(memberId)));

    if (!memberId || !mongoose.Types.ObjectId.isValid(String(memberId))) {
      console.log('ScanAttendance: invalid or missing memberId:', memberId);
      return res.status(400).json({
        success: false,
        message: "A valid memberId is required in the QR payload",
      });
    }

    const payloadTenantSlug = String(
      parsedPayload.tenantSlug || "",
    ).toLowerCase();
    const requestTenantSlug = String(req.tenant.slug).toLowerCase();
    console.log('ScanAttendance tenantSlugs:', payloadTenantSlug, requestTenantSlug);

    if (payloadTenantSlug && payloadTenantSlug !== requestTenantSlug) {
      console.log('ScanAttendance: tenant slug mismatch', payloadTenantSlug, requestTenantSlug);
      return res.status(403).json({
        success: false,
        message: "QR payload tenant does not match the current workspace",
      });
    }

    const member = await User.findOne({
      _id: memberId,
      tenantId: req.tenant._id,
      role: "member",
      isActive: true,
    });

    console.log('ScanAttendance found member:', !!member);
    if (!member) {
      console.log('ScanAttendance: member not found for id', memberId, 'tenant', req.tenant._id);
      return res.status(404).json({
        success: false,
        message: "Member not found in this workspace",
      });
    }

    const now = new Date();
    console.log('ScanAttendance proceeding at', now);
    // timezone-aware day bounds using server local timezone (keeps existing behavior)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // If the member already checked in today, return an explicit message
    const alreadyCheckedIn = await CheckIn.findOne({
      tenantId: req.tenant._id,
      user: member._id,
      checkInAt: { $gte: startOfToday, $lt: endOfToday },
    });

    console.log('ScanAttendance alreadyCheckedIn:', !!alreadyCheckedIn);
    if (alreadyCheckedIn) {
      console.log('ScanAttendance: member already checked in today');
      return res.status(400).json({
        success: false,
        message: "Already checked in",
        data: {
          name: member.name,
          planStatus: member.subscription?.status || "unknown",
        },
      });
    }
    // Subscription/session handling: ensure limited packages have sessions remaining
    const subscription = member.subscription || {};
    const isLimited = subscription.membershipType === "limited";
    let newRemainingSessions = null;

    if (isLimited) {
      const remaining = Number(subscription.remainingSessions || 0);
      if (remaining <= 0) {
        return res.status(400).json({
          success: false,
          message: "Subscription expired: No sessions remaining.",
          data: {
            name: member.name,
            planStatus: subscription.status || "unknown",
          },
        });
      }
      newRemainingSessions = Math.max(remaining - 1, 0);
    }
    const previousAttendance = member.lastAttendanceAt
      ? new Date(member.lastAttendanceAt)
      : null;
    const previousStreak = member.gamification?.attendanceStreak || 0;
    const attendanceStreak = calculateAttendanceStreak(
      previousAttendance,
      previousStreak,
      now,
    );
    const expiresAt = new Date(now.getTime() + 90 * 60 * 1000);

    const checkIn = await CheckIn.create({
      user: member._id,
      tenantId: req.tenant._id,
      status: "checked_in",
      checkInAt: now,
      expiresAt,
      locationType: "gym",
    });
    const updatedUser = await User.findOneAndUpdate(
      { _id: member._id, tenantId: req.tenant._id },
      {
        $set: {
          lastAttendanceAt: now,
          "gamification.attendanceStreak": attendanceStreak,
          ...(isLimited && {
            "subscription.remainingSessions": newRemainingSessions,
            "subscription.status":
              newRemainingSessions === 0 ? "expired" : subscription.status,
          }),
        },
        $push: {
          attendanceHistory: {
            date: now,
            checkInType: "gym",
          },
        },
      },
      { new: true },
    );

    await awardPoints(member._id, req.tenant._id, 10, "Attendance check-in", {
      attendanceStreak,
    });

    res.status(200).json({
      success: true,
      message: "Attendance recorded successfully",
      data: {
        checkIn,
        user: updatedUser,
        name: member.name,
        planStatus: member.subscription?.status || "unknown",
      },
    });
  } catch (error) {
    console.error("ScanAttendance Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Unable to scan attendance",
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
          hour: { $hour: { date: "$checkInAt", timezone: "Africa/Cairo" } },
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
