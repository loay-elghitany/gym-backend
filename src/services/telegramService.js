const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const User = require("../models/User");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;
const isDev = process.env.NODE_ENV !== "production";
const shouldStartPolling = botToken && process.env.NODE_ENV !== "test";

let bot;
if (shouldStartPolling) {
  bot = new TelegramBot(botToken, { polling: false });
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const rawUserId = match?.[1]?.trim();

    if (!rawUserId) {
      return bot.sendMessage(
        chatId,
        "Please use /start <userId> to link your Gym account.",
      );
    }

    if (!mongoose.Types.ObjectId.isValid(rawUserId)) {
      return bot.sendMessage(chatId, "Invalid user identifier provided.");
    }

    try {
      const user = await User.findById(rawUserId);
      if (!user) {
        return bot.sendMessage(
          chatId,
          "Unable to link account: user not found.",
        );
      }

      user.telegramChatId = String(chatId);
      await user.save();

      await bot.sendMessage(
        chatId,
        "Successfully linked to your Gym account! You will now receive Telegram notifications.",
      );
    } catch (error) {
      console.error("[TelegramService] /start handler failed:", error);
      bot.sendMessage(
        chatId,
        "There was an error linking your account. Please try again later.",
      );
    }
  });
}

const sendTelegramMessage = async (message, toChatId) => {
  const targetChatId = toChatId || defaultChatId;
  if (!bot || !targetChatId) {
    if (isDev) {
      console.log("[TelegramService] Stub message:", message);
    }
    return;
  }

  try {
    await bot.sendMessage(targetChatId, message, { parse_mode: "Markdown" });
    if (isDev) {
      console.log("[TelegramService] Message sent successfully");
    }
  } catch (error) {
    console.error("[TelegramService] Error sending message:", error.message);
  }
};

const getAbsenceDays = (member) => {
  const referenceDate = member?.lastAttendanceAt
    ? new Date(member.lastAttendanceAt)
    : member?.createdAt
      ? new Date(member.createdAt)
      : null;

  if (!referenceDate || Number.isNaN(referenceDate.getTime())) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
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
  const absenceDays = getAbsenceDays(member);
  const message = `*Inactive Member Alert*\n\nName: ${member.name}\nEmail: ${member.email || "N/A"}\nDays absent: ${absenceDays}\nTenant: ${tenant.name} (${tenant.slug})\n\nPlease reach out and reactivate this member.`;
  return sendTelegramMessage(message);
};

exports.sendNewTraineeRegistrationNotification = async (
  member,
  tenant,
  targetChatId,
) => {
  const packageName =
    member.subscription?.packageType ||
    member.subscription?.packageId?.name ||
    "Standard Plan";
  const message = `🔔 **متدرب جديد انضم للجيم!**\n- **الاسم:** ${member.name}\n- **الباقة:** ${packageName}\n- **التاريخ:** ${new Date().toLocaleDateString("en-GB")}`;
  return sendTelegramMessage(message, targetChatId);
};

exports.sendTelegramMessage = sendTelegramMessage;
