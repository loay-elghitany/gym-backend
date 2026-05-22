const {
  checkExpiringSubscriptionsForTenant,
} = require("../services/subscriptionNotificationService");

exports.checkExpirations = async (req, res) => {
  try {
    const expiringMembers = await checkExpiringSubscriptionsForTenant(
      req.tenant,
    );

    return res.status(200).json({
      success: true,
      message: "Checked expiring subscription notifications",
      data: {
        notifiedCount: expiringMembers.length,
        members: expiringMembers.map((member) => ({
          name: member.name,
          email: member.email,
          expiresAt: member.subscription.expiresAt,
        })),
      },
    });
  } catch (error) {
    console.error("NotificationController Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking subscription expirations",
      error: error.message,
    });
  }
};
