const User = require("../models/User");
const { sendTelegramMessage } = require("../services/telegramService");

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const members = await User.find({
      tenantId: req.tenant._id,
      role: "member",
      "subscription.status": "active",
      "subscription.expiresAt": { $gte: now, $lte: in30Days },
    })
      .select("subscription.price")
      .lean();

    const expected30DayRevenue = members.reduce(
      (sum, member) => sum + (Number(member.subscription?.price) || 0),
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        expected30DayRevenue,
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
