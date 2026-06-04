import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import { products, formatPrice } from "./products";

const TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const ADMIN_ID = process.env["TELEGRAM_ADMIN_ID"];

if (!TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

if (!ADMIN_ID) {
  throw new Error("TELEGRAM_ADMIN_ID is required");
}

const bot = new TelegramBot(TOKEN, { polling: true });

const PAYMENT_INFO = `
🏦 *Metode Pembayaran:*
• Transfer Bank BCA: 1234567890 (a/n Nama Kamu)
• GoPay / OVO / Dana: 08123456789
• QRIS: (kirim bukti transfer ke bot ini)
`;

const userSessions: Record<number, { step: string; selectedProduct?: string }> = {};

function getProductListText(): string {
  let text = "🛒 *Daftar Produk Tersedia:*\n\n";
  products.forEach((p, i) => {
    text += `${i + 1}. *${p.name}*\n`;
    text += `   📝 ${p.description}\n`;
    text += `   💰 ${formatPrice(p.price)} / ${p.duration}\n\n`;
  });
  return text;
}

function getProductKeyboard() {
  const keyboard = products.map((p) => [
    { text: `${p.name} — ${formatPrice(p.price)}`, callback_data: `buy_${p.id}` },
  ]);
  keyboard.push([{ text: "❌ Batal", callback_data: "cancel" }]);
  return { inline_keyboard: keyboard };
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from?.first_name || "Kawan";

  userSessions[chatId] = { step: "menu" };

  await bot.sendMessage(
    chatId,
    `👋 Halo *${name}*!\n\nSelamat datang di *Toko Aplikasi Premium* 🎉\n\nKami menyediakan berbagai aplikasi premium dengan harga terjangkau dan proses cepat!\n\nKetuk tombol di bawah untuk melihat produk kami:`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛍️ Lihat Produk", callback_data: "show_products" }],
          [{ text: "📞 Hubungi Admin", callback_data: "contact_admin" }],
        ],
      },
    }
  );
});

bot.onText(/\/produk/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, getProductListText(), {
    parse_mode: "Markdown",
    reply_markup: getProductKeyboard(),
  });
});

bot.onText(/\/bantuan/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `📚 *Cara Pemesanan:*\n\n1️⃣ Ketik /produk untuk melihat daftar produk\n2️⃣ Pilih produk yang kamu inginkan\n3️⃣ Konfirmasi pesanan\n4️⃣ Lakukan pembayaran sesuai instruksi\n5️⃣ Kirim bukti transfer\n6️⃣ Pesanan diproses oleh admin\n\n❓ Ada pertanyaan? Hubungi admin dengan /admin`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `📞 *Hubungi Admin:*\n\nAdmin kami siap membantu kamu!\n👉 @username_admin\n\nJam operasional: 24 jam\n\n_Bot ini otomatis memproses pesanan dan mengirim notifikasi ke admin._`,
    { parse_mode: "Markdown" }
  );
});

bot.on("callback_query", async (query) => {
  if (!query.message || !query.from) return;

  const chatId = query.message.chat.id;
  const data = query.data || "";
  const name = query.from.first_name || "Pembeli";

  await bot.answerCallbackQuery(query.id);

  if (data === "show_products") {
    await bot.sendMessage(chatId, getProductListText(), {
      parse_mode: "Markdown",
      reply_markup: getProductKeyboard(),
    });
    return;
  }

  if (data === "contact_admin") {
    await bot.sendMessage(
      chatId,
      `📞 *Hubungi Admin:*\n\nSilakan hubungi admin kami untuk pertanyaan lebih lanjut.\n\nJam operasional: 24 jam (bot otomatis)`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data === "cancel") {
    userSessions[chatId] = { step: "menu" };
    await bot.sendMessage(chatId, "❌ Pesanan dibatalkan. Ketik /start untuk kembali ke menu utama.", {
      parse_mode: "Markdown",
    });
    return;
  }

  if (data.startsWith("buy_")) {
    const productId = data.replace("buy_", "");
    const product = products.find((p) => p.id === productId);

    if (!product) {
      await bot.sendMessage(chatId, "❌ Produk tidak ditemukan.");
      return;
    }

    userSessions[chatId] = { step: "confirm", selectedProduct: productId };

    await bot.sendMessage(
      chatId,
      `🛒 *Detail Pesanan:*\n\n📦 Produk: *${product.name}*\n📝 Deskripsi: ${product.description}\n⏳ Durasi: ${product.duration}\n💰 Harga: *${formatPrice(product.price)}*\n\nApakah kamu yakin ingin membeli produk ini?`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Ya, Beli Sekarang", callback_data: `confirm_${productId}` },
              { text: "❌ Batal", callback_data: "cancel" },
            ],
          ],
        },
      }
    );
    return;
  }

  if (data.startsWith("confirm_")) {
    const productId = data.replace("confirm_", "");
    const product = products.find((p) => p.id === productId);

    if (!product) {
      await bot.sendMessage(chatId, "❌ Produk tidak ditemukan.");
      return;
    }

    userSessions[chatId] = { step: "waiting_payment", selectedProduct: productId };

    await bot.sendMessage(
      chatId,
      `✅ *Pesanan Dikonfirmasi!*\n\n📦 ${product.name} — ${formatPrice(product.price)}\n\n${PAYMENT_INFO}\n\n📸 Setelah transfer, kirim *bukti pembayaran* (screenshot) ke chat ini.\n\n_Pesanan akan diproses dalam waktu 1x24 jam setelah pembayaran terkonfirmasi._`,
      { parse_mode: "Markdown" }
    );

    const orderTime = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const adminMessage =
      `🔔 *PESANAN BARU!*\n\n` +
      `👤 Nama: ${name}\n` +
      `🆔 User ID: ${query.from.id}\n` +
      `📦 Produk: ${product.name}\n` +
      `💰 Harga: ${formatPrice(product.price)}\n` +
      `⏰ Waktu: ${orderTime}\n\n` +
      `_Buyer sudah menerima instruksi pembayaran._`;

    try {
      await bot.sendMessage(ADMIN_ID!, adminMessage, { parse_mode: "Markdown" });
      logger.info({ productId, buyerId: query.from.id }, "Order notification sent to admin");
    } catch (err) {
      logger.error({ err }, "Failed to send admin notification");
    }

    return;
  }
});

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions[chatId];

  if (!session || session.step !== "waiting_payment") {
    await bot.sendMessage(
      chatId,
      "ℹ️ Ketik /start untuk memulai atau /produk untuk melihat daftar produk.",
    );
    return;
  }

  const product = session.selectedProduct
    ? products.find((p) => p.id === session.selectedProduct)
    : null;

  const name = msg.from?.first_name || "Pembeli";
  const orderTime = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const adminCaption =
    `📸 *BUKTI PEMBAYARAN DITERIMA*\n\n` +
    `👤 Nama: ${name}\n` +
    `🆔 User ID: ${msg.from?.id}\n` +
    `📦 Produk: ${product ? product.name : "Tidak diketahui"}\n` +
    `💰 Harga: ${product ? formatPrice(product.price) : "-"}\n` +
    `⏰ Waktu: ${orderTime}\n\n` +
    `_Harap verifikasi dan proses pesanan ini._`;

  try {
    const fileId = msg.photo![msg.photo!.length - 1].file_id;
    await bot.sendPhoto(ADMIN_ID!, fileId, {
      caption: adminCaption,
      parse_mode: "Markdown",
    });

    userSessions[chatId] = { step: "done" };

    await bot.sendMessage(
      chatId,
      `✅ *Bukti pembayaran berhasil dikirim!*\n\nAdmin akan memverifikasi pembayaran kamu dan memproses pesanan dalam waktu singkat.\n\nTerima kasih telah berbelanja! 🎉\n\nKetik /start untuk kembali ke menu utama.`,
      { parse_mode: "Markdown" }
    );

    logger.info({ buyerId: msg.from?.id, productId: session.selectedProduct }, "Payment proof received");
  } catch (err) {
    logger.error({ err }, "Failed to forward payment proof");
    await bot.sendMessage(chatId, "❌ Gagal mengirim bukti. Coba lagi atau hubungi admin.");
  }
});

bot.on("polling_error", (err) => {
  logger.error({ err }, "Telegram polling error");
});

logger.info("Telegram bot started");

export { bot };
