const { Telegraf, Markup } = require("telegraf");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("./db");

function setupBot(token, webAppUrl) {
  if (!token || token === "YOUR_BOT_TOKEN_HERE") {
    console.log("BOT_TOKEN is missing in .env");
    return null;
  }

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    try {
      const db = await getDb();
      const tgUser = ctx.from;
      const tgIdStr = tgUser.id.toString();
      const startPayload = ctx.payload;

      let user = await db.get("SELECT * FROM users WHERE telegram_id = ?", [tgIdStr]);

      if (!user) {
        const newUserId = uuidv4();
        await db.run(
          "INSERT INTO users (id, telegram_id, username, first_name) VALUES (?, ?, ?, ?)",
          [newUserId, tgIdStr, tgUser.username || "", tgUser.first_name || ""]
        );
        user = await db.get("SELECT * FROM users WHERE id = ?", [newUserId]);

        if (startPayload && startPayload.startsWith("ref_")) {
          const referrerTgId = startPayload.replace("ref_", "");

          if (referrerTgId !== tgIdStr) {
            const referrer = await db.get("SELECT * FROM users WHERE telegram_id = ?", [referrerTgId]);

            if (referrer) {
              await db.run(
                "INSERT OR IGNORE INTO referrals (id, referrer_id, referred_id) VALUES (?, ?, ?)",
                [uuidv4(), referrer.id, user.id]
              );
              await db.run("UPDATE users SET coins = coins + 500 WHERE id = ?", [referrer.id]);
              await db.run("UPDATE referrals SET reward_claimed = 1 WHERE referred_id = ?", [user.id]);

              try {
                await bot.telegram.sendMessage(
                  referrer.telegram_id,
                  "New referral joined! You received +500 coins."
                );
              } catch (e) {}
            }
          }
        }
      }

      ctx.reply(
        `Welcome ${tgUser.first_name}! Click below to play Laser Escape:`,
        Markup.inlineKeyboard([
          [Markup.button.webApp("Open Game", webAppUrl || "https://google.com")],
        ])
      );
    } catch (err) {
      console.error("Bot start error:", err);
    }
  });

  bot.launch().then(() => console.log("Telegram Bot Online"));
  return bot;
}

module.exports = { setupBot };
