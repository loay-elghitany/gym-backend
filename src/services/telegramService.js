const TelegramBot = require("node-telegram-bot-api");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let bot;
if (botToken && chatId) {
  bot = new TelegramBot(botToken, { polling: false });
}

const sendTelegramMessage = async (message) => {
  if (!bot || !chatId) {
    console.log("[TelegramService] Stub message:", message);
    return;
  }

  try {
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    console.log("[TelegramService] Message sent successfully");
  } catch (error) {
    console.error("[TelegramService] Error sending message:", error.message);
  }
};

exports.sendWelcomeMessage = async (user, tenant) => {
  const message = `*New user registered*\n
*Name:* ${user.name}
*Email:* ${user.email}
*Tenant:* ${tenant.name} (${tenant.slug})
*Role:* ${user.role}`;
  return sendTelegramMessage(message);
};

exports.sendExpiryReminder = async (tenant) => {
  const message = `*Subscription Reminder*\n\nTenant ${tenant.name} (${tenant.slug}) has a subscription nearing expiry. Please follow up with billing.`;
  return sendTelegramMessage(message);
};

exports.sendInactiveMemberAlert = async (member, tenant) => {
  const absenceDays = member.lastAttendanceAt
    ? Math.floor(
        (Date.now() - new Date(member.lastAttendanceAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : "more than 10";
  const message = `*Inactive Member Alert*\n\nName: ${member.name}\nEmail: ${member.email || "N/A"}\nDays absent: ${absenceDays}\nTenant: ${tenant.name} (${tenant.slug})\n\nPlease reach out and reactivate this member.`;
  return sendTelegramMessage(message);
};
