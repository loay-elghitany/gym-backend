const User = require("../models/User");
const { sendInactiveMemberAlert } = require("../services/telegramService");

exports.getChurnRadar = async (req, res) => {
  try {
    const daysSinceLastAttendance = parseInt(req.query.days, 10) || 10;
    const cutoffDate = new Date(
      Date.now() - daysSinceLastAttendance * 24 * 60 * 60 * 1000,
    );

    const membersAtRisk = await User.find({
      tenantSlug: req.tenant.slug,
      role: "member",
      isActive: true,
      $or: [
        { lastAttendanceAt: null },
        { lastAttendanceAt: { $lt: cutoffDate } },
      ],
    })
      .select(
        "name email phone lastAttendanceAt createdAt gamification attendanceHistory",
      )
      .lean();

    const normalizedMembers = membersAtRisk.map((member) => {
      const referenceDate = member.lastAttendanceAt
        ? new Date(member.lastAttendanceAt)
        : new Date(member.createdAt || Date.now());
      const daysAbsent = Math.max(
        0,
        Math.floor(
          (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      return {
        ...member,
        lastAttendanceAt: referenceDate,
        daysAbsent,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        daysSinceLastAttendance,
        count: normalizedMembers.length,
        members: normalizedMembers,
      },
    });
  } catch (error) {
    console.error("GetChurnRadar Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching churn radar",
      error: error.message,
    });
  }
};

exports.notifyInactiveMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "memberId is required to notify an inactive member",
      });
    }

    const member = await User.findOne({
      _id: memberId,
      tenantId: req.tenant._id,
      role: "member",
      isActive: true,
    }).lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Inactive member not found",
      });
    }

    await sendInactiveMemberAlert(member, req.tenant);

    res.status(200).json({
      success: true,
      message: "Telegram notification sent for inactive member",
      data: { memberId },
    });
  } catch (error) {
    console.error("NotifyInactiveMember Error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending notification",
      error: error.message,
    });
  }
};
