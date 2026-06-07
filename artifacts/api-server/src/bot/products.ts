export interface Duration {
  id: string;
  label: string;
  days: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  requireEmail: boolean;
  inStock: boolean; // true = ada stok, false = habis
  durations: Duration[];
}

export const products: Product[] = [

  // ══════════════════════════════════════════
  //  EDITING
  // ══════════════════════════════════════════
  {
    id: "canva",
    name: "Canva Pro",
    description: "Akun dari Buyer — Sistem invite lewat email",
    category: "editing",
    requireEmail: true,
    inStock: true,
    durations: [
      { id: "canva_1m",       label: "1 Bulan",            days: 30,   price: 2000  },
      { id: "canva_1m_admin", label: "1 Bulan (Admin)",    days: 30,   price: 10000 },
      { id: "canva_2m",       label: "2 Bulan",            days: 60,   price: 3000  },
      { id: "canva_3m",       label: "3 Bulan",            days: 90,   price: 5000  },
      { id: "canva_6m",       label: "6 Bulan",            days: 180,  price: 8000  },
      { id: "canva_1y",       label: "1 Tahun",            days: 365,  price: 15000 },
      { id: "canva_1y_lang",  label: "1 Tahun (Langsung)", days: 365,  price: 20000 },
      { id: "canva_lt",       label: "Lifetime",           days: 9999, price: 25000 },
    ],
  },
  {
    id: "alight",
    name: "Alight Motion",
    description: "Akun dari Seller",
    category: "editing",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "alight_1y_private", label: "1 Tahun Private", days: 365, price: 10000 },
      { id: "alight_1y_sharing", label: "1 Tahun Sharing", days: 365, price: 7000  },
    ],
  },
  {
    id: "capcut",
    name: "CapCut",
    description: "Akun dari Seller — Laptop wajib beli Private",
    category: "editing",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "capcut_1m_sharing",  label: "1 Bulan (Sharing)",  days: 30,  price: 10000 },
      { id: "capcut_2m_sharing",  label: "2 Bulan (Sharing)",  days: 60,  price: 18000 },
      { id: "capcut_1w_private",  label: "1 Minggu (Private)", days: 7,   price: 5000  },
      { id: "capcut_2w_private",  label: "2 Minggu (Private)", days: 14,  price: 10000 },
      { id: "capcut_1m_private",  label: "1 Bulan (Private)",  days: 30,  price: 15000 },
    ],
  },
  {
    id: "picsart",
    name: "PicsArt",
    description: "Akun dari Seller",
    category: "editing",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "picsart_1m_sharing", label: "1 Bulan (Sharing)", days: 30, price: 10000 },
      { id: "picsart_1m_private", label: "1 Bulan (Private)", days: 30, price: 15000 },
    ],
  },

  // ══════════════════════════════════════════
  //  STREAMING
  // ══════════════════════════════════════════
  {
    id: "youtube",
    name: "YouTube Premium",
    description: "Akun Famplan/Indplan dari Seller — Max 2 Bulan per akun",
    category: "streaming",
    requireEmail: true,
    inStock: true,
    durations: [
      { id: "yt_fam_1m",  label: "1 Bulan (Famplan Head)", days: 30,  price: 10000 },
      { id: "yt_fam_1mb", label: "1 Bulan (Famplan)",      days: 30,  price: 5000  },
      { id: "yt_fam_2m",  label: "2 Bulan (Famplan)",      days: 60,  price: 8000  },
      { id: "yt_fam_3m",  label: "3 Bulan (Famplan)",      days: 90,  price: 12000 },
      { id: "yt_fam_4m",  label: "4 Bulan (Famplan)",      days: 120, price: 15000 },
      { id: "yt_fam_6m",  label: "6 Bulan (Famplan)",      days: 180, price: 20000 },
      { id: "yt_ind_1m",  label: "1 Bulan (Indplan)",      days: 30,  price: 10000 },
      { id: "yt_ind_3m",  label: "3 Bulan (Indplan)",      days: 90,  price: 20000 },
    ],
  },
  {
    id: "bstation",
    name: "Bstation (Bilibili)",
    description: "Akun dari Seller — Khusus Private: Beli min 1 Bulan",
    category: "streaming",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "bstation_1m_sharing", label: "1 Bulan (Sharing)",  days: 30,  price: 10000 },
      { id: "bstation_3m_sharing", label: "3 Bulan (Sharing)",  days: 90,  price: 15000 },
      { id: "bstation_1y_sharing", label: "1 Tahun (Sharing)",  days: 365, price: 20000 },
      { id: "bstation_1w_private", label: "1 Minggu (Private)", days: 7,   price: 10000 },
      { id: "bstation_1m_private", label: "1 Bulan (Private)",  days: 30,  price: 35000 },
    ],
  },
  {
    id: "netflix",
    name: "Netflix",
    description: "Akun Sharing — Login 2 Device — Disarankan untuk HP",
    category: "streaming",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "netflix_1m", label: "1 Bulan", days: 30, price: 45000  },
      { id: "netflix_2m", label: "2 Bulan", days: 60, price: 85000  },
      { id: "netflix_3m", label: "3 Bulan", days: 90, price: 125000 },
    ],
  },
  {
    id: "wetv",
    name: "WeTV",
    description: "Akun dari Seller",
    category: "streaming",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "wetv_1m_sharing",   label: "1 Bulan (Sharing)",    days: 30, price: 12000 },
      { id: "wetv_1m_antilimit", label: "1 Bulan (Anti Limit)", days: 30, price: 17000 },
      { id: "wetv_3m_sharing",   label: "3 Bulan (Sharing)",    days: 90, price: 22000 },
      { id: "wetv_1m_private",   label: "1 Bulan (Private)",    days: 30, price: 32000 },
    ],
  },
  {
    id: "vidio",
    name: "Vidio",
    description: "Akun Seller — Akun Platinum tersedia",
    category: "streaming",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "vidio_1m_mobile",  label: "1 Bulan Mobile Only (Sharing)", days: 30, price: 15000 },
      { id: "vidio_1m_alldev",  label: "1 Bulan All Device (Private)",  days: 30, price: 38000 },
      { id: "vidio_1m_mobpriv", label: "1 Bulan Mobile Only (Private)", days: 30, price: 27000 },
      { id: "vidio_1m_tv",      label: "1 Bulan TV Only (Private)",     days: 30, price: 10000 },
    ],
  },
  {
    id: "amazonprime",
    name: "Amazon Prime Video",
    description: "Akun dari Seller",
    category: "streaming",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "amazon_1m", label: "1 Bulan", days: 30, price: 15000 },
    ],
  },

  // ══════════════════════════════════════════
  //  MUSIC
  // ══════════════════════════════════════════
  {
    id: "spotify",
    name: "Spotify Premium",
    description: "Akun dari Seller — Durasi 1-3 Bulan tergantung stok pusat",
    category: "music",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "spotify_1_3m", label: "1-3 Bulan", days: 90, price: 20000 },
    ],
  },
  {
    id: "ytmusic",
    name: "YouTube Music Premium",
    description: "Sudah termasuk saat beli YouTube Premium Famplan",
    category: "music",
    requireEmail: true,
    inStock: true,
    durations: [
      { id: "ytmusic_1m", label: "1 Bulan (Famplan)",  days: 30,  price: 5000  },
      { id: "ytmusic_3m", label: "3 Bulan (Famplan)",  days: 90,  price: 12000 },
      { id: "ytmusic_6m", label: "6 Bulan (Famplan)",  days: 180, price: 20000 },
    ],
  },

  // ══════════════════════════════════════════
  //  TOOLS
  // ══════════════════════════════════════════
  {
    id: "chatgpt",
    name: "ChatGPT Plus",
    description: "Akun dari Seller — Bisnis bisa invite akun lain",
    category: "tools",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "chatgpt_1w_sharing", label: "1 Minggu (Sharing)",       days: 7,  price: 12000 },
      { id: "chatgpt_1m_sharing", label: "1 Bulan (Sharing)",        days: 30, price: 18000 },
      { id: "chatgpt_1m_bisnis",  label: "1 Bulan (Private Bisnis)", days: 30, price: 25000 },
      { id: "chatgpt_1m_plus",    label: "1 Bulan (Private Plus)",   days: 30, price: 20000 },
    ],
  },
  {
    id: "gemini",
    name: "Gemini AI",
    description: "Akun dari Seller",
    category: "tools",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "gemini_1y_sharing", label: "1 Tahun (Sharing)", days: 365, price: 21000 },
      { id: "gemini_1m_private", label: "1 Bulan (Private)", days: 30,  price: 15000 },
    ],
  },
  {
    id: "ibispaint",
    name: "Ibis Paint X",
    description: "Akun Sharing dari Seller",
    category: "tools",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "ibis_1m", label: "1 Bulan", days: 30,  price: 10000 },
      { id: "ibis_1y", label: "1 Tahun", days: 365, price: 15000 },
    ],
  },
  {
    id: "scribd",
    name: "Scribd",
    description: "Akun dari Seller",
    category: "tools",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "scribd_1m_sharing", label: "1 Bulan (Sharing)", days: 30, price: 15000 },
      { id: "scribd_2m_sharing", label: "2 Bulan (Sharing)", days: 60, price: 20000 },
      { id: "scribd_1m_private", label: "1 Bulan (Private)", days: 30, price: 20000 },
      { id: "scribd_2m_private", label: "2 Bulan (Private)", days: 60, price: 30000 },
    ],
  },
  {
    id: "cursor",
    name: "Cursor AI Code Editor",
    description: "Akun dari Seller",
    category: "tools",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "cursor_1w", label: "1 Minggu", days: 7, price: 10000 },
    ],
  },
  {
    id: "surfshark",
    name: "SurfShark VPN",
    description: "Akun dari Seller",
    category: "tools",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "surfshark_1w", label: "1 Minggu", days: 7, price: 10000 },
    ],
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Akun Private dari Seller",
    category: "tools",
    requireEmail: false,
    inStock: true,
    durations: [
      { id: "zoom_7d",  label: "7 Hari",  days: 7,  price: 8000  },
      { id: "zoom_14d", label: "14 Hari", days: 14, price: 10000 },
    ],
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}
