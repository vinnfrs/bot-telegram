# Toko Aplikasi Premium — Telegram Bot

Bot Telegram untuk jualan aplikasi premium secara otomatis 24 jam, lengkap dengan alur pembelian, notifikasi pesanan ke admin, dan penerusan bukti pembayaran.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — jalankan server + bot Telegram (port 8080)
- `pnpm run typecheck` — typecheck semua package
- `pnpm run build` — typecheck + build semua package
- Required env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Bot: node-telegram-bot-api (polling mode)
- DB: PostgreSQL + Drizzle ORM (tersedia, belum dipakai)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/index.ts` — logika utama bot Telegram
- `artifacts/api-server/src/bot/products.ts` — daftar produk & helper format harga
- `artifacts/api-server/src/index.ts` — entry point server (import bot di sini)

## Product

Bot Telegram aktif 24 jam untuk jualan aplikasi premium:
- `/start` — sambutan + menu utama
- `/produk` — tampil daftar produk dengan tombol beli
- `/bantuan` — panduan cara pesan
- Alur pembelian: pilih produk → konfirmasi → instruksi bayar → kirim bukti transfer
- Notifikasi otomatis ke admin saat ada pesanan baru dan bukti transfer masuk

## User preferences

- Bahasa Indonesia untuk komunikasi
- Bot harus aktif 24 jam tanpa henti

## Gotchas

- Bot menggunakan polling mode — harus selalu running agar menerima pesan
- Untuk mengubah daftar produk, edit `artifacts/api-server/src/bot/products.ts` lalu restart server
- Untuk mengubah info pembayaran, edit konstanta `PAYMENT_INFO` di `artifacts/api-server/src/bot/index.ts`
- TELEGRAM_BOT_TOKEN dan TELEGRAM_ADMIN_ID wajib ada di Replit Secrets

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
