const TelegramBot = require("node-telegram-bot-api");
const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.BOT_TOKEN;

// BOT NOMINI SHU YERDAN O'ZGARTIRASAN
const BOT_NAME = "@YuklaUzsbot";

if (!TOKEN) {
    console.log("❌ BOT_TOKEN topilmadi!");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN, {
    polling: true
});

console.log("🚀 Bot ishga tushdi!");


// =========================
// START
// =========================

bot.onText(/^\/start$/, async (msg) => {

    const text = `🔥 Assalomu alaykum. ${BOT_NAME} ga Xush kelibsiz.

Bot orqali quyidagilarni yuklab olishingiz mumkin:

• Instagram - post va IGTV + audio bilan;
• TikTok - suv belgisiz video + audio bilan;
• YouTube - videolar va shorts + audio bilan;
• Snapchat - suv belgisiz video + audio bilan;
• Likee - suv belgisiz video + audio bilan;
• Pinterest - suv belgisiz video va rasmlar + audio bilan;
• Threads - video va rasmlar + audio bilan;

Shazam funksiya:
• Qo‘shiq nomi yoki ijrochi ismi
• Qo‘shiq matni
• Ovozli xabar
• Video
• Audio
• Video xabar

🚀 Yuklab olmoqchi bo'lgan videoga havolani yuboring!

😎 Bot guruhlarda ham ishlay oladi!`;

    await bot.sendMessage(msg.chat.id, text);
});


// =========================
// LINK ANIQLASH
// =========================

function isUrl(text) {
    return /^https?:\/\/\S+/i.test(text);
}


// =========================
// VIDEO YUKLASH
// =========================

bot.on("message", async (msg) => {

    if (!msg.text) return;

    if (msg.text.startsWith("/")) return;

    const url = msg.text.trim();

    if (!isUrl(url)) {
        return bot.sendMessage(
            msg.chat.id,
            "🔗 Video linkini yuboring."
        );
    }

    const chatId = msg.chat.id;

    // vaqtinchalik fayl
    const folder = path.join(__dirname, "downloads");

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    const fileName = `video_${Date.now()}.mp4`;
    const filePath = path.join(folder, fileName);

    let waitMessage;

    try {

        waitMessage = await bot.sendMessage(
            chatId,
            "⏳ Kutib turing..."
        );

        console.log("📥 Link:", url);

        // =========================
        // YUKLASH
        // =========================

        await youtubedl(url, {
            output: filePath,

            // video + audio
            format: "best[ext=mp4]/best",

            // mp4
            mergeOutputFormat: "mp4",

            // playlist emas
            noPlaylist: true,

            // xatoliklarni ko'rsatish
            noWarnings: true,

            // vaqt limiti
            socketTimeout: 30000
        });

        // =========================
        // TEKSHIRISH
        // =========================

        if (!fs.existsSync(filePath)) {
            throw new Error("Video fayl topilmadi");
        }

        const stats = fs.statSync(filePath);

        if (stats.size === 0) {
            throw new Error("Video bo'sh");
        }


        // =========================
        // VIDEO YUBORISH
        // =========================

        await bot.sendVideo(
            chatId,
            filePath,
            {
                caption: `📥 ${BOT_NAME} orqali yuklab olindi`,
                supports_streaming: true
            }
        );


        // Kuting xabarini o'chirish
        if (waitMessage) {
            await bot.deleteMessage(
                chatId,
                waitMessage.message_id
            ).catch(() => {});
        }


        // =========================
        // FAYLNI O'CHIRISH
        // =========================

        fs.unlinkSync(filePath);

        console.log("✅ Video yuborildi");

    } catch (error) {

        console.log("❌ Xatolik:", error.message);

        if (waitMessage) {
            await bot.deleteMessage(
                chatId,
                waitMessage.message_id
            ).catch(() => {});
        }

        // fayl qolib ketgan bo'lsa
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await bot.sendMessage(
            chatId,
            `❌ Videoni yuklab bo'lmadi.

Sabab:
${error.message}

🔗 Boshqa video linkini yuborib ko'ring.`
        );
    }
});
