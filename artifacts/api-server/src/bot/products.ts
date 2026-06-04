export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Netflix Premium",
    description: "Akses Netflix 4K Ultra HD, 4 layar sekaligus",
    price: 45000,
    duration: "1 Bulan",
  },
  {
    id: "2",
    name: "Spotify Premium",
    description: "Musik tanpa iklan, download offline, kualitas tinggi",
    price: 25000,
    duration: "1 Bulan",
  },
  {
    id: "3",
    name: "Disney+ Hotstar",
    description: "Film, serial, dan konten olahraga eksklusif",
    price: 35000,
    duration: "1 Bulan",
  },
  {
    id: "4",
    name: "YouTube Premium",
    description: "Video tanpa iklan, YouTube Music, download video",
    price: 30000,
    duration: "1 Bulan",
  },
  {
    id: "5",
    name: "Canva Pro",
    description: "Desain grafis profesional dengan ribuan template premium",
    price: 50000,
    duration: "1 Bulan",
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}
