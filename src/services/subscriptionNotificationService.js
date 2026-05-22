const User = require("../models/User");
const Tenant = require("../models/Tenant");
const telegramService = require("./telegramService");
const isDev = process.env.NODE_ENV !== "production";

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const checkExpiringSubscriptionsForTenant = async (tenant) => {
  if (!tenant) {
    throw new Error("Tenant context is required for expiration checks");
  }

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const expiringMembers = await User.find({
    tenantId: tenant._id,
    "subscription.status": "active",
    "subscription.expiresAt": { $gte: now, $lte: threeDaysFromNow },
  }).select("name email subscription");

  if (!expiringMembers.length) {
    if (isDev) {
      console.log(
        `[NotificationService] No subscriptions expiring in 3 days for tenant: ${tenant.slug}`,
      );
    }
    return [];
  }

  await Promise.all(
    expiringMembers.map(async (member) => {
      const message = `*Subscription expiring soon*

*Member:* ${member.name}
*Email:* ${member.email || "N/A"}
*Expires:* ${formatDate(member.subscription.expiresAt)}
*Tenant:* ${tenant.name} (${tenant.slug})

Please reach out and renew the membership before expiry.`;
      if (isDev) {
        console.log(
          `[NotificationService] Sending Telegram message for member: ${member.email || member.name}`,
        );
      }
      return telegramService.sendTelegramMessage(message);
    }),
  );

  return expiringMembers;
};

const scanAllTenantExpirations = async () => {
  const tenants = await Tenant.find({ isActive: true });

  const notifications = [];
  for (const tenant of tenants) {
    const expiringMembers = await checkExpiringSubscriptionsForTenant(tenant);
    if (expiringMembers.length) {
      notifications.push({
        tenant: tenant.slug,
        count: expiringMembers.length,
      });
    }
  }

  if (isDev) {
    console.log(
      `[NotificationService] Completed subscription expiration scan. Tenants notified: ${notifications.length}`,
    );
  }
  return notifications;
};

module.exports = {
  checkExpiringSubscriptionsForTenant,
  scanAllTenantExpirations,
};
