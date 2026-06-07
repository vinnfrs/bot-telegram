import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import { products, formatPrice, Product } from "./products";

const TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const ADMIN_ID = process.env["TELEGRAM_ADMIN_ID"];

if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required");
if (!ADMIN_ID) throw new Error("TELEGRAM_ADMIN_ID is required");

const bot = new TelegramBot(TOKEN, { polling: true });

const QRIS_FILE_ID = "AgACAgUAAxkBAAFLf15qIXBSF8mrV09qcFv0ZSxQM-CJmQACHBBrG47xCVXRQzRwiF7kjwEAAwIAA3MAAzsE";

// ─── Stok override per DURASI ──────────────────────────────
// key = duration id (misal "netflix_1m"), value = true/false
// Jika tidak ada di sini, default = ada stok (true)
const stockOverride: Record<string, boolean> = {};

function isDurationInStock(durationId: string): boolean {
  if (durationId in stockOverride) return stockOverride[durationId];
  return true; // default: ada stok
}

// ─── Session buyer ─────────────────────────────────────────
const userSessions: Record<number, {
  step: string;
  selectedProduct?: string;
  selectedDuration?: string;
  buyerEmail?: string;
}> = {};

// ─── Data order (untuk kirim akun/invoice) ─────────────────
const orderData: Record<number, {
  buyerName: string;
  productName: string;
  durationLabel: string;
  price: number;
  buyerEmail?: string;
}> = {};

// ─── Kategori ──────────────────────────────────────────────
const categories: { id: string; label: string; emoji: string }[] = [
  { id: "streaming", label: "Streaming Apps", emoji: "🎬" },
  { id: "music",     label: "Music Apps",     emoji: "🎵" },
  { id: "editing",   label: "Editing Apps",   emoji: "🎨" },
  { id: "tools",     label: "Tools",          emoji: "🔧" },
];

// ─── Keyboard Helpers ──────────────────────────────────────
function getMainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🛍️ Lihat Produk",  callback_data: "show_products" }],
      [{ text: "📞 Hubungi Admin", url: "https://t.me/vinnfrs" }],
    ],
  };
}

function getCategoryKeyboard() {
  const rows = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = categories.slice(i, i + 2).map((c) => ({
      text: `${c.emoji} ${c.label}`,
      callback_data: `cat_${c.id}`,
    }));
    rows.push(row);
  }
  rows.push([{ text: "🔙 Kembali", callback_data: "back_main" }]);
  return { inline_keyboard: rows };
}

function getProductKeyboard(categoryId: string) {
  const filtered = products.filter((p) => p.category === categoryId);
  const keyboard = filtered.map((p) => [{
    text: p.name,
    callback_data: `buy_${p.id}`,
  }]);
  keyboard.push([{ text: "🔙 Kembali ke Kategori", callback_data: "show_products" }]);
  return { inline_keyboard: keyboard };
}

function getDurationKeyboard(product: Product) {
  const keyboard = product.durations.map((d) => {
    const inStock = isDurationInStock(d.id);
    return [{
      // Kalau habis, tampil label HABIS + tidak bisa diklik (outofstock_)
      text: inStock
        ? `⏳ ${d.label} — ${formatPrice(d.price)}`
        : `❌ ${d.label} — HABIS`,
      callback_data: inStock ? `dur_${d.id}` : `durhabis_${d.id}`,
    }];
  });
  keyboard.push([{ text: "🔙 Kembali", callback_data: `cat_${product.category}` }]);
  return { inline_keyboard: keyboard };
}

function getAdminActionKeyboard(buyerId: number) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Kirim Akun",    callback_data: `send_account_${buyerId}` },
        { text: "🧾 Kirim Invoice", callback_data: `send_invoice_${buyerId}` },
      ],
      [{ text: "💬 Buka Chat Buyer", url: `tg://user?id=${buyerId}` }],
    ],
  };
}

// ─── Helper: Edit bubble atau kirim baru ───────────────────
async function editOrSend(
  query: TelegramBot.CallbackQuery,
  text: string,
  keyboard: TelegramBot.InlineKeyboardMarkup
) {
  const chatId    = query.message!.chat.id;
  const messageId = query.message!.message_id;
  try {
    await bot.editMessageText(text, {
      chat_id:      chatId,
      message_id:   messageId,
      parse_mode:   "Markdown",
      reply_markup: keyboard,
    });
  } catch {
    await bot.sendMessage(chatId, text, {
      parse_mode:   "Markdown",
      reply_markup: keyboard,
    });
  }
}

// ─── Helper: Validasi email ────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Helper: Proses pembayaran ─────────────────────────────
async function processPayment(
  chatId: number,
  productId: string,
  durationId: string,
  buyerName: string,
  buyerId: number,
  buyerEmail?: string
) {
  const product  = products.find((p) => p.id === productId);
  const duration = product?.durations.find((d) => d.id === durationId);

  if (!product || !duration) {
    await bot.sendMessage(chatId, "❌ Pesanan tidak ditemukan.");
    return;
  }

  userSessions[chatId] = {
    step: "waiting_payment",
    selectedProduct:  productId,
    selectedDuration: durationId,
    buyerEmail,
  };

  orderData[buyerId] = {
    buyerName,
    productName:   product.name,
    durationLabel: duration.label,
    price:         duration.price,
    buyerEmail,
  };

  const emailInfo = buyerEmail
    ? `\n📧 Email kamu: *${buyerEmail}*\n_Admin akan invite ke email ini._\n`
    : "";

  await bot.sendMessage(
    chatId,
    `🏦 *Metode Pembayaran:*\n\n` +
    `• Seabank: 901643865481 (a/n Kevin F.R)\n` +
    `• GoPay / Dana / ShopeePay: 0895385164021\n` +
    `• QRIS (scan di bawah)\n\n` +
    emailInfo,
    { parse_mode: "Markdown" }
  );

  await bot.sendPhoto(chatId, QRIS_FILE_ID, {
    caption:
      `📱 *Scan QRIS ini untuk pembayaran*\n\n` +
      `📸 Setelah transfer, kirim *screenshot bukti bayar* ke chat ini.\n\n` +
      `_Pesanan diproses dalam 1x24 jam setelah pembayaran terkonfirmasi._`,
    parse_mode: "Markdown",
  });

  const orderTime    = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const adminMessage =
    `🔔 *PESANAN BARU!*\n\n` +
    `👤 Nama: ${buyerName}\n` +
    `🆔 User ID: \`${buyerId}\`\n` +
    `📦 Produk: ${product.name}\n` +
    `⏳ Durasi: ${duration.label}\n` +
    `💰 Harga: ${formatPrice(duration.price)}\n` +
    (buyerEmail ? `📧 Email: ${buyerEmail}\n` : "") +
    `⏰ Waktu: ${orderTime}\n\n` +
    `_Gunakan tombol di bawah untuk memproses pesanan ini._`;

  try {
    await bot.sendMessage(ADMIN_ID!, adminMessage, {
      parse_mode:   "Markdown",
      reply_markup: getAdminActionKeyboard(buyerId),
    });
    logger.info({ productId, durationId, buyerId }, "Order notification sent to admin");
  } catch (err) {
    logger.error({ err }, "Failed to send admin notification");
  }
}

// ═══════════════════════════════════════════════════════════
//  PERINTAH BUYER
// ═══════════════════════════════════════════════════════════

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name   = msg.from?.first_name || "Kawan";
  userSessions[chatId] = { step: "menu" };

  await bot.sendMessage(
    chatId,
    `👋 Halo *${name}*!\n\nSelamat datang di *Vstore* 🎉\n\nKami menyediakan berbagai aplikasi premium dengan harga terjangkau dan proses cepat!\n\n/help untuk cara pemesanan\n/admin untuk menghubungi admin\n\nKetuk tombol di bawah untuk melihat produk kami:`,
    { parse_mode: "Markdown", reply_markup: getMainKeyboard() }
  );
});

bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `📚 *Cara Pemesanan:*\n\n1️⃣ Ketik /start lalu pilih *Lihat Produk*\n2️⃣ Pilih kategori aplikasi\n3️⃣ Pilih produk yang kamu inginkan\n4️⃣ Pilih durasi langganan\n5️⃣ Konfirmasi pesanan\n6️⃣ Lakukan pembayaran\n7️⃣ Kirim bukti transfer\n8️⃣ Pesanan diproses oleh admin ✅\n\n❓ Pertanyaan? Hubungi admin dengan /admin`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/admin/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `📞 *Hubungi Admin:*\n\nAdmin kami siap membantu kamu!\n👉 @vinnfrs\n\nJam operasional: 24 jam`,
    { parse_mode: "Markdown" }
  );
});

// ═══════════════════════════════════════════════════════════
//  PERINTAH ADMIN
// ═══════════════════════════════════════════════════════════

// /stok → lihat semua status stok per durasi
bot.onText(/^\/stok(@\w+)?$/, async (msg) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  const chatId = msg.chat.id;

  // Kelompokkan per kategori, kirim per pesan agar tidak melebihi batas 4096 karakter
  const grouped: Record<string, typeof products> = {};
  for (const p of products) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  const categoryLabel: Record<string, string> = {
    streaming: "🎬 Streaming",
    music:     "🎵 Music",
    editing:   "🎨 Editing",
    tools:     "🔧 Tools",
  };

  await bot.sendMessage(chatId, `📦 *Status Stok — semua produk:*\n_(dikirim per kategori)_`, { parse_mode: "Markdown" });

  for (const [catId, catProducts] of Object.entries(grouped)) {
    let text = `*${categoryLabel[catId] ?? catId}*\n\n`;
    for (const p of catProducts) {
      text += `▸ *${p.name}*\n`;
      for (const d of p.durations) {
        const status = isDurationInStock(d.id) ? "✅" : "❌";
        text += `   ${status} \`${d.id}\` — ${d.label}\n`;
      }
      text += "\n";
    }
    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  await bot.sendMessage(
    chatId,
    `_Ubah stok: /stok <id\\_durasi> on/off_\n_Contoh: /stok netflix\\_1m off_`,
    { parse_mode: "Markdown" }
  );
});

// /stok <duration_id> on/off → ubah stok per durasi
bot.onText(/\/stok (\S+) (on|off)/, async (msg, match) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  const durationId = match![1].toLowerCase();
  const status     = match![2].toLowerCase();

  // Cari produk & durasi yang cocok
  const product  = products.find((p) => p.durations.some((d) => d.id === durationId));
  const duration = product?.durations.find((d) => d.id === durationId);

  if (!product || !duration) {
    await bot.sendMessage(
      msg.chat.id,
      `❌ Duration ID *${durationId}* tidak ditemukan.\n\nKetik /stok untuk lihat semua ID durasi.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  stockOverride[durationId] = status === "on";

  await bot.sendMessage(
    msg.chat.id,
    `✅ Stok berhasil diubah!\n\n` +
    `📦 Produk: *${product.name}*\n` +
    `⏳ Durasi: *${duration.label}*\n` +
    `Status: ${status === "on" ? "✅ Ada Stok" : "❌ Habis"}`,
    { parse_mode: "Markdown" }
  );

  logger.info({ durationId, status }, "Duration stock updated by admin");
});

// /kirim <user_id> <isi pesan>
bot.onText(/\/kirim (.+)/, async (msg, match) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  const args    = match![1].split(" ");
  const buyerId = parseInt(args[0]);
  const isi     = args.slice(1).join(" ");

  if (!buyerId || !isi) {
    await bot.sendMessage(
      msg.chat.id,
      `❌ Format salah!\n\nGunakan:\n/kirim <user_id> <isi pesan>\n\nContoh:\n/kirim 123456789 Email: abc@gmail.com\nPass: 12345`
    );
    return;
  }

  try {
    await bot.sendMessage(
      buyerId,
      `📦 *Pesanan Kamu Sudah Diproses!*\n\n${isi}\n\n_Terima kasih telah berbelanja di Vstore! 🎉_`,
      { parse_mode: "Markdown" }
    );
    await bot.sendMessage(msg.chat.id, `✅ Pesan berhasil dikirim ke buyer (ID: ${buyerId})`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal kirim ke buyer. Pastikan user ID benar.`);
    logger.error({ err }, "Failed to send message to buyer");
  }
});

// /invoice <user_id> <detail akun>
bot.onText(/\/invoice (.+)/, async (msg, match) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  const args    = match![1].split(" ");
  const buyerId = parseInt(args[0]);
  const detail  = args.slice(1).join(" ");

  if (!buyerId) {
    await bot.sendMessage(msg.chat.id, `❌ Format salah!\n\nGunakan:\n/invoice <user_id> <detail akun>`);
    return;
  }

  const order     = orderData[buyerId];
  const orderTime = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const invoiceText =
    `🧾 *INVOICE - Vstore*\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ *Pesanan Selesai Diproses!*\n\n` +
    `👤 Nama: ${order?.buyerName || "Buyer"}\n` +
    `📦 Produk: ${order?.productName || "-"}\n` +
    `⏳ Durasi: ${order?.durationLabel || "-"}\n` +
    `💰 Total: ${order ? formatPrice(order.price) : "-"}\n` +
    `⏰ Tanggal: ${orderTime}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 *Detail Akun:*\n${detail}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `_Simpan pesan ini sebagai bukti pembelian._\n` +
    `_Terima kasih telah berbelanja! 🎉_`;

  try {
    await bot.sendMessage(buyerId, invoiceText, { parse_mode: "Markdown" });
    await bot.sendMessage(msg.chat.id, `✅ Invoice berhasil dikirim ke buyer (ID: ${buyerId})`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `❌ Gagal kirim invoice. Pastikan user ID benar.`);
    logger.error({ err }, "Failed to send invoice to buyer");
  }
});

// /help_admin
bot.onText(/\/help_admin/, async (msg) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  await bot.sendMessage(
    msg.chat.id,
    `🛠️ *Perintah Admin:*\n\n` +
    `*Kelola Stok (per durasi):*\n` +
    `/stok — lihat semua status stok\n` +
    `/stok <duration\\_id> on — aktifkan stok\n` +
    `/stok <duration\\_id> off — nonaktifkan stok\n` +
    `_Contoh: /stok netflix\\_1m off_\n\n` +
    `*Kirim ke Buyer:*\n` +
    `/kirim <user\\_id> <isi pesan>\n` +
    `/invoice <user\\_id> <detail akun>\n\n` +
    `💡 Duration ID & User ID ada di notifikasi pesanan.`,
    { parse_mode: "Markdown" }
  );
});

// ═══════════════════════════════════════════════════════════
//  CALLBACK QUERY
// ═══════════════════════════════════════════════════════════
bot.on("callback_query", async (query) => {
  if (!query.message || !query.from) return;

  const chatId = query.message.chat.id;
  const data   = query.data || "";
  const name   = query.from.first_name || "Pembeli";

  try { await bot.answerCallbackQuery(query.id); } catch { /* query expired */ }

  // ── Durasi habis → popup notif
  if (data.startsWith("durhabis_")) {
    const durationId = data.replace("durhabis_", "");
    const product    = products.find((p) => p.durations.some((d) => d.id === durationId));
    const duration   = product?.durations.find((d) => d.id === durationId);

    try {
      await bot.answerCallbackQuery(query.id, {
        text: `❌ Stok ${duration?.label || "durasi ini"} sedang habis!`,
        show_alert: true,
      });
    } catch { /* abaikan */ }
    // Tidak perlu ganti halaman, buyer tetap di halaman pilih durasi
    return;
  }

  // ── Admin: tombol kirim akun
  if (data.startsWith("send_account_")) {
    if (String(chatId) !== ADMIN_ID) return;
    const buyerId = data.replace("send_account_", "");
    await bot.sendMessage(
      chatId,
      `📤 *Kirim Akun ke Buyer*\n\nGunakan perintah:\n/kirim ${buyerId} <isi akun>\n\nContoh:\n/kirim ${buyerId} Email: abc@gmail.com\nPass: 12345`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // ── Admin: tombol kirim invoice
  if (data.startsWith("send_invoice_")) {
    if (String(chatId) !== ADMIN_ID) return;
    const buyerId = data.replace("send_invoice_", "");
    await bot.sendMessage(
      chatId,
      `🧾 *Kirim Invoice ke Buyer*\n\nGunakan perintah:\n/invoice ${buyerId} <detail akun>\n\nContoh:\n/invoice ${buyerId} Email: abc@gmail.com\nPass: 12345`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // ── Kembali ke menu utama
  if (data === "back_main") {
    await editOrSend(query,
      `🏠 *Menu Utama*\n\nKetuk tombol di bawah untuk melihat produk kami:`,
      getMainKeyboard()
    );
    return;
  }

  // ── Tampilkan kategori
  if (data === "show_products") {
    await editOrSend(query,
      `🛍️ *Pilih Kategori Produk:*\n\nSilakan pilih kategori yang kamu inginkan:`,
      getCategoryKeyboard()
    );
    return;
  }

  // ── Hubungi admin
  if (data === "contact_admin") {
    await editOrSend(query,
      `📞 *Hubungi Admin:*\n\nSilakan hubungi admin kami.\n👉 @vinnfrs\n\nJam operasional: 24 jam`,
      { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "back_main" }]] }
    );
    return;
  }

  // ── Batal
  if (data === "cancel") {
    userSessions[chatId] = { step: "menu" };
    await editOrSend(query,
      `❌ *Pesanan dibatalkan.*\n\nKetuk tombol di bawah untuk kembali ke menu utama.`,
      getMainKeyboard()
    );
    return;
  }

  // ── Pilih kategori
  if (data.startsWith("cat_")) {
    const catId    = data.replace("cat_", "");
    const cat      = categories.find((c) => c.id === catId);
    const filtered = products.filter((p) => p.category === catId);

    if (filtered.length === 0) {
      await editOrSend(query,
        `⚠️ Belum ada produk di kategori ini.\n\nSilakan pilih kategori lain:`,
        getCategoryKeyboard()
      );
      return;
    }

    await editOrSend(query,
      `${cat?.emoji || "📦"} *${cat?.label || catId}*\n\nPilih produk yang kamu inginkan:`,
      getProductKeyboard(catId)
    );
    return;
  }

  // ── Pilih produk → tampilkan durasi
  if (data.startsWith("buy_")) {
    const productId = data.replace("buy_", "");
    const product   = products.find((p) => p.id === productId);

    if (!product) {
      await bot.sendMessage(chatId, "❌ Produk tidak ditemukan.");
      return;
    }

    userSessions[chatId] = { step: "select_duration", selectedProduct: productId };

    await editOrSend(query,
      `📦 *${product.name}*\n📝 ${product.description}\n\n⏳ *Pilih durasi langganan:*\n_❌ = stok habis_`,
      getDurationKeyboard(product)
    );
    return;
  }

  // ── Pilih durasi → konfirmasi
  if (data.startsWith("dur_")) {
    const durationId = data.replace("dur_", "");
    const product    = products.find((p) => p.durations.some((d) => d.id === durationId));
    const duration   = product?.durations.find((d) => d.id === durationId);

    if (!product || !duration) {
      await bot.sendMessage(chatId, "❌ Durasi tidak ditemukan.");
      return;
    }

    // Double-check stok saat klik
    if (!isDurationInStock(durationId)) {
      try {
        await bot.answerCallbackQuery(query.id, {
          text: `❌ Stok ${duration.label} baru saja habis!`,
          show_alert: true,
        });
      } catch { /* abaikan */ }
      return;
    }

    userSessions[chatId] = {
      step: "confirm",
      selectedProduct:  product.id,
      selectedDuration: durationId,
    };

    await editOrSend(query,
      `🛒 *Detail Pesanan:*\n\n` +
      `📦 Produk: *${product.name}*\n` +
      `📝 ${product.description}\n` +
      `⏳ Durasi: *${duration.label}*\n` +
      `💰 Harga: *${formatPrice(duration.price)}*\n\n` +
      `Apakah kamu yakin ingin membeli?`,
      {
        inline_keyboard: [[
          { text: "✅ Ya, Beli Sekarang", callback_data: `confirm_${product.id}__${durationId}` },
          { text: "❌ Batal",              callback_data: "cancel" },
        ]],
      }
    );
    return;
  }

  // ── Konfirmasi → cek email atau langsung bayar
  if (data.startsWith("confirm_")) {
    const parts      = data.replace("confirm_", "").split("__");
    const productId  = parts[0];
    const durationId = parts[1];
    const product    = products.find((p) => p.id === productId);
    const duration   = product?.durations.find((d) => d.id === durationId);

    if (!product || !duration) {
      await bot.sendMessage(chatId, "❌ Pesanan tidak ditemukan.");
      return;
    }

    try {
      await bot.editMessageText(
        `✅ *Pesanan Dikonfirmasi!*\n\n` +
        `📦 ${product.name} — ${duration.label}\n` +
        `💰 Total: *${formatPrice(duration.price)}*`,
        {
          chat_id:    chatId,
          message_id: query.message!.message_id,
          parse_mode: "Markdown",
        }
      );
    } catch { /* abaikan */ }

    if (product.requireEmail) {
      userSessions[chatId] = {
        step: "waiting_email",
        selectedProduct:  productId,
        selectedDuration: durationId,
      };
      await bot.sendMessage(
        chatId,
        `📧 *Masukkan Email Kamu*\n\n` +
        `Produk *${product.name}* menggunakan sistem invite.\n\n` +
        `Silakan ketik *email Google* kamu:\n` +
        `_(Contoh: namakamu@gmail.com)_`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    await processPayment(chatId, productId, durationId, name, query.from.id);
    return;
  }
});

// ═══════════════════════════════════════════════════════════
//  PESAN TEKS (tangkap email buyer)
// ═══════════════════════════════════════════════════════════
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId  = msg.chat.id;
  const session = userSessions[chatId];

  if (!session || session.step !== "waiting_email") return;

  const email = msg.text.trim();

  if (!isValidEmail(email)) {
    await bot.sendMessage(
      chatId,
      `❌ *Format email tidak valid!*\n\nContoh yang benar: namakamu@gmail.com\n\nSilakan kirim ulang email kamu:`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  await bot.sendMessage(
    chatId,
    `✅ Email *${email}* berhasil dicatat!\n\n_Memproses pesanan kamu..._`,
    { parse_mode: "Markdown" }
  );

  await processPayment(
    chatId,
    session.selectedProduct!,
    session.selectedDuration!,
    msg.from?.first_name || "Pembeli",
    msg.from!.id,
    email
  );
});

// ═══════════════════════════════════════════════════════════
//  TERIMA BUKTI BAYAR (foto)
// ═══════════════════════════════════════════════════════════
bot.on("photo", async (msg) => {
  const chatId  = msg.chat.id;
  const session = userSessions[chatId];

  if (!session || session.step !== "waiting_payment") {
    await bot.sendMessage(chatId, "ℹ️ Ketik /start untuk memulai atau pilih produk terlebih dahulu.");
    return;
  }

  const product  = session.selectedProduct
    ? products.find((p) => p.id === session.selectedProduct) : null;
  const duration = product && session.selectedDuration
    ? product.durations.find((d) => d.id === session.selectedDuration) : null;

  const name      = msg.from?.first_name || "Pembeli";
  const orderTime = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const adminCaption =
    `📸 *BUKTI PEMBAYARAN DITERIMA*\n\n` +
    `👤 Nama: ${name}\n` +
    `🆔 User ID: \`${msg.from?.id}\`\n` +
    `📦 Produk: ${product  ? product.name               : "Tidak diketahui"}\n` +
    `⏳ Durasi: ${duration ? duration.label              : "-"}\n` +
    `💰 Harga: ${duration  ? formatPrice(duration.price) : "-"}\n` +
    (session.buyerEmail ? `📧 Email: ${session.buyerEmail}\n` : "") +
    `⏰ Waktu: ${orderTime}\n\n` +
    `_Gunakan tombol di bawah untuk memproses pesanan._`;

  try {
    const fileId = msg.photo![msg.photo!.length - 1].file_id;

    await bot.sendPhoto(ADMIN_ID!, fileId, {
      caption:      adminCaption,
      parse_mode:   "Markdown",
      reply_markup: getAdminActionKeyboard(msg.from!.id),
    });

    userSessions[chatId] = { step: "done" };

    await bot.sendMessage(
      chatId,
      `✅ *Bukti pembayaran berhasil dikirim!*\n\n⏳ *Pesananmu sedang diproses...*\n\nAdmin akan memverifikasi dan memproses pesanan kamu dalam waktu singkat.\n\nKetik /start untuk kembali ke menu utama.`,
      { parse_mode: "Markdown" }
    );

    logger.info({ buyerId: msg.from?.id, productId: session.selectedProduct }, "Payment proof received");
  } catch (err) {
    logger.error({ err }, "Failed to forward payment proof");
    await bot.sendMessage(chatId, "❌ Gagal mengirim bukti. Coba lagi atau hubungi admin.");
  }
});

// ─── Polling Error ─────────────────────────────────────────
bot.on("polling_error", (err) => {
  logger.error({ err: String(err) }, "Telegram polling error");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason: String(reason) }, "Unhandled promise rejection (bot)");
});

logger.info("Telegram bot started");

export { bot };