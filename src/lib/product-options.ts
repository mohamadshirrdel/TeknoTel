export const MAX_IMAGES = 10;
export const MAX_CAMERAS = 4;

export const COLORS = [
  { key: "black", label: "مشکی", hex: "#111827" },
  { key: "white", label: "سفید", hex: "#f9fafb" },
  { key: "silver", label: "نقره‌ای", hex: "#c0c4cc" },
  { key: "gray", label: "خاکستری", hex: "#6b7280" },
  { key: "titanium", label: "تیتانیوم", hex: "#8a8d8f" },
  { key: "gold", label: "طلایی", hex: "#d4af37" },
  { key: "blue", label: "آبی", hex: "#2563eb" },
  { key: "green", label: "سبز", hex: "#16a34a" },
  { key: "red", label: "قرمز", hex: "#dc2626" },
  { key: "purple", label: "بنفش", hex: "#7c3aed" },
  { key: "pink", label: "صورتی", hex: "#ec4899" },
] as const;

export const RAM_OPTIONS = [2, 3, 4, 6, 8, 12, 16, 24];
export const STORAGE_OPTIONS = [16, 32, 64, 128, 256, 512, 1024];
export const DISPLAY_TYPES = [
  "AMOLED",
  "Super AMOLED",
  "Dynamic AMOLED",
  "LTPO AMOLED",
  "OLED",
  "IPS LCD",
  "LCD",
  "TFT",
];

const fa = (n: number) => n.toLocaleString("fa-IR");

export const formatStorage = (gb: number) =>
  gb >= 1024 ? `${fa(gb / 1024)} ترابایت` : `${fa(gb)} گیگابایت`;

const CAMERA_TITLES = ["", "تک‌گانه", "دوگانه", "سه‌گانه", "چهارگانه"];

// [48, 48, 48] -> «سه‌گانه ۴۸ + ۴۸ + ۴۸ مگاپیکسل»
export function cameraText(mp: number[]) {
  if (mp.length === 0 || mp.length > MAX_CAMERAS) return "";

  return `${CAMERA_TITLES[mp.length]} ${mp.map(fa).join(" + ")} مگاپیکسل`;
}
