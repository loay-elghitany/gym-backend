const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const User = require("../models/User");
const enTranslations = require("../locales/en/telegram.json");
const arTranslations = require("../locales/ar/telegram.json");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;
const isDev = process.env.NODE_ENV !== "production";
const shouldStartPolling = botToken && process.env.NODE_ENV !== "test";

let bot;
if (shouldStartPolling) {
  try {
    bot = new TelegramBot(botToken, { polling: true });

    // Robust /start handler: only attempt DB linking when a payload is present.
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat?.id;
      try {
        const rawPayload = match?.[1];

        const langCode = msg.from?.language_code || "";
        const lang = String(langCode).toLowerCase().startsWith("ar")
          ? "ar"
          : "en";

        const t = (key) => {
          if (lang === "ar")
            return arTranslations[key] || enTranslations[key] || key;
          return enTranslations[key] || arTranslations[key] || key;
        };

        // Plain /start with no payload -> graceful welcome message.
        if (!rawPayload || String(rawPayload).trim() === "") {
          return bot.sendMessage(chatId, t("welcome_plain"));
        }

        const rawUserId = String(rawPayload).trim();

        // Only validate and query DB when there is a payload present.
        if (!mongoose.Types.ObjectId.isValid(rawUserId)) {
          return bot.sendMessage(chatId, t("invalid_user_identifier"));
        }

        try {
          const user = await User.findById(rawUserId);
          if (!user) {
            return bot.sendMessage(chatId, t("user_not_found"));
          }

          user.telegramChatId = String(chatId);
          await user.save();

          await bot.sendMessage(chatId, t("link_success"));
        } catch (dbErr) {
          console.error(
            "[TelegramService] DB error during /start linking:",
            dbErr,
          );
          // Fail gracefully without crashing the process
          try {
            await bot.sendMessage(chatId, t("link_error"));
          } catch (sendErr) {
            console.error(
              "[TelegramService] Failed to send error message to user:",
              sendErr,
            );
          }
        }
      } catch (handlerErr) {
        console.error(
          "[TelegramService] /start handler unexpected error:",
          handlerErr,
        );
        try {
          await bot.sendMessage(chatId, t("unexpected_error"));
        } catch (sendErr) {
          console.error(
            "[TelegramService] Failed to notify user about unexpected error:",
            sendErr,
          );
        }
      }
    });

    // Global bot error listeners to prevent silent failures
    bot.on("polling_error", (err) =>
      console.error("[TelegramService] Polling error:", err),
    );
    bot.on("webhook_error", (err) =>
      console.error("[TelegramService] Webhook error:", err),
    );
    bot.on("error", (err) =>
      console.error("[TelegramService] Bot error:", err),
    );
  } catch (initErr) {
    console.error(
      "[TelegramService] Failed to initialize Telegram bot:",
      initErr,
    );
  }
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
