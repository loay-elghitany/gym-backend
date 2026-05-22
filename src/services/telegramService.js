const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const User = require("../models/User");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;
const isDev = process.env.NODE_ENV !== "production";

let bot;
if (botToken) {
  bot = new TelegramBot(botToken, { polling: true });
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
