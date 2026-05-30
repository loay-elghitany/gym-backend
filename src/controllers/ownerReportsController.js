const User = require("../models/User");
const { sendTelegramMessage } = require("../services/telegramService");
const mongoose = require("mongoose");

const getFirstDayOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

exports.getDashboard = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const now = new Date();

    // Get all required metrics
    const activeMembers = await User.countDocuments({
      tenantId,
      role: "member",
      "subscription.status": "active",
      "subscription.expiresAt": { $gt: now },
    });

    const monthStart = getFirstDayOfMonth(now);
    const newTraineesThisMonth = await User.countDocuments({
      tenantId,
      role: "member",
      createdAt: { $gte: monthStart },
    });

    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = await User.countDocuments({
      tenantId,
      role: "member",
      "subscription.status": "active",
      "subscription.expiresAt": { $gte: now, $lte: in7Days },
    });

    // Calculate expected 30-day revenue
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = await User.find({
      tenantId,
      role: "member",
      "subscription.status": "active",
      "subscription.expiresAt": { $gte: now, $lte: in30Days },
    })
      .select("subscription.price")
      .lean();

    const expected30DayRevenue = upcomingRenewals.reduce(
      (sum, member) => sum + (Number(member.subscription?.price) || 0),
      0,
    );

    // Monthly revenue (current month active subscriptions)
    let monthlyRevenue = 0;
    try {
      const revenueData = await User.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            role: "member",
            "subscription.status": "active",
            "subscription.expiresAt": { $gt: monthStart },
          },
        },
        {
          $lookup: {
            from: "membershippackages",
            localField: "subscription.packageId",
            foreignField: "_id",
            as: "package",
          },
        },
        { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            revenueAmount: {
              $cond: [
                { $gt: [{ $ifNull: ["$subscription.price", 0] }, 0] },
                "$subscription.price",
                { $ifNull: ["$package.price", 0] },
              ],
            },
          },
        },
        { $group: { _id: null, revenue: { $sum: "$revenueAmount" } } },
      ]);
      monthlyRevenue = Math.round((revenueData[0]?.revenue || 0) * 100) / 100;
    } catch (err) {
      monthlyRevenue = 0;
    }

    res.status(200).json({
      success: true,
      data: {
        activeMembers,
        newTraineesThisMonth,
        expiringSoon,
        expected30DayRevenue,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("OwnerReports getDashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Error loading dashboard reports",
      error: error.message,
    });
  }
};

exports.notifyMember = async (req, res) => {
  try {
    const member = await User.findOne({
      _id: req.params.memberId,
      tenantId: req.tenant._id,
      role: "member",
    })
      .select("name email telegramChatId")
      .lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const owner = await User.findOne({
      tenantId: req.tenant._id,
      role: "gymowner",
    })
      .select("+telegramChatId")
      .lean();

    const ownerChatId = owner?.telegramChatId || undefined;
    const message = `🔔 *Re-engagement reminder*\n\nName: ${member.name || member.email || "Member"}\nTenant: ${req.tenant.name} (${req.tenant.slug})\nPlease follow up with this member to recover attendance and revenue.`;

    await sendTelegramMessage(message, ownerChatId);

    res.status(200).json({
      success: true,
      message: `Re-engagement notification sent to ${member.name || member.email}.`,
    });
  } catch (error) {
    console.error("OwnerReports notifyMember Error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending notification",
      error: error.message,
    });
  }
};

exports.exportMembers = async (req, res) => {
  try {
    const members = await User.find({
      tenantId: req.tenant._id,
    })
      .select("name email phone role createdAt lastAttendanceAt subscription")
      .populate("subscription.packageId", "name price")
      .sort({ createdAt: -1 });

    const escapeCsv = (value) => {
      const text = value === undefined || value === null ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      [
        "Full Name",
        "Email",
        "Phone",
        "Role",
        "Join Date",
        "Current Package Name",
        "Package Price",
        "Subscription Status",
        "Total Sessions Quota",
        "Remaining Sessions",
        "Last Check-In Date",
      ],
      ...members.map((member) => {
        const subscription = member.subscription || {};
        const packageName =
          subscription.packageId?.name ||
          subscription.packageType ||
          "No Package";
        const packagePrice = Number(
          subscription.packageId?.price ?? subscription.price ?? 0,
        ).toFixed(2);
        const status = subscription.status || "N/A";
        const totalSessions = subscription.totalSessions ?? 0;
        const remainingSessions = subscription.remainingSessions ?? 0;
        const joinedDate = member.createdAt
          ? new Date(member.createdAt).toISOString().split("T")[0]
          : "";
        const lastCheckIn = member.lastAttendanceAt
          ? new Date(member.lastAttendanceAt).toISOString().split("T")[0]
          : "N/A";

        return [
          member.name || "N/A",
          member.email || "N/A",
          member.phone || "N/A",
          member.role || "N/A",
          joinedDate,
          packageName,
          packagePrice,
          status,
          totalSessions,
          remainingSessions,
          lastCheckIn,
        ];
      }),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=members.csv");
    res.status(200).send(csv);
  } catch (error) {
    console.error("OwnerReports exportMembers Error:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting members",
      error: error.message,
    });
  }
};
