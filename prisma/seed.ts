import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateId } from "../src/lib/id";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const img = (text: string) =>
  `https://placehold.co/600x600/png?text=${encodeURIComponent(text)}`;

const categories = [
  { name: "گوشی موبایل", slug: "phones" },
  { name: "لوازم جانبی", slug: "accessories" },
  { name: "شارژر و کابل", slug: "chargers" },
  { name: "هندزفری و هدفون", slug: "handsfree" },
  { name: "قطعات و LCD", slug: "parts" },
];

const products = [
  {
    title: "گوشی سامسونگ Galaxy A55 ظرفیت ۲۵۶ گیگابایت",
    slug: "samsung-galaxy-a55",
    cat: "phones",
    price: 21500000,
    discount: 5,
    stock: 12,
    brand: "Samsung",
  },
  {
    title: "گوشی شیائومی Redmi Note 13 ظرفیت ۱۲۸ گیگابایت",
    slug: "xiaomi-redmi-note-13",
    cat: "phones",
    price: 12900000,
    discount: 0,
    stock: 20,
    brand: "Xiaomi",
  },
  {
    title: "گوشی اپل iPhone 15 ظرفیت ۱۲۸ گیگابایت",
    slug: "apple-iphone-15",
    cat: "phones",
    price: 52000000,
    discount: 3,
    stock: 5,
    brand: "Apple",
  },
  {
    title: "قاب سیلیکونی مناسب Galaxy A55",
    slug: "case-galaxy-a55",
    cat: "accessories",
    price: 250000,
    discount: 0,
    stock: 50,
    brand: "Generic",
  },
  {
    title: "گلس محافظ صفحه نمایش مدل Full Cover",
    slug: "glass-full-cover",
    cat: "accessories",
    price: 120000,
    discount: 10,
    stock: 100,
    brand: "Generic",
  },
  {
    title: "شارژر دیواری ۲۵ وات سامسونگ",
    slug: "samsung-charger-25w",
    cat: "chargers",
    price: 890000,
    discount: 0,
    stock: 30,
    brand: "Samsung",
  },
  {
    title: "کابل شارژ USB-C به USB-C یک متری",
    slug: "cable-usbc-1m",
    cat: "chargers",
    price: 180000,
    discount: 15,
    stock: 80,
    brand: "Anker",
  },
  {
    title: "هندزفری بلوتوثی ایرپاد مدل Pro",
    slug: "bluetooth-earbuds-pro",
    cat: "handsfree",
    price: 1450000,
    discount: 8,
    stock: 25,
    brand: "Generic",
  },
  {
    title: "هدفون سیمی با میکروفون",
    slug: "wired-headset",
    cat: "handsfree",
    price: 320000,
    discount: 0,
    stock: 0,
    brand: "JBL",
  },
  {
    title: "ال‌سی‌دی اورجینال Galaxy A52",
    slug: "lcd-galaxy-a52",
    cat: "parts",
    price: 3200000,
    discount: 0,
    stock: 7,
    brand: "Samsung",
  },
];

const sims = [
  { number: "09121234567", price: 1500000, type: "عادی" },
  { number: "09125550000", price: 15000000, type: "رند" },
  { number: "09129998888", price: 25000000, type: "طلایی" },
  { number: "09123334455", price: 4000000, type: "رند" },
  { number: "09120001122", price: 900000, type: "عادی" },
];

async function main() {
  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: {
        id: generateId(),
        ...c,
      },
    });
    catIds[c.slug] = row.id;
  }

  for (const { cat, ...p } of products) {
    const data = {
      ...p,
      categoryId: catIds[cat],
      images: [img(p.brand ?? "Product")],
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: {
        id: generateId(),
        ...data,
      },
    });
  }

  for (const s of sims) {
    await prisma.simNumber.upsert({
      where: { number: s.number },
      update: { price: s.price, type: s.type },
      create: {
        id: generateId(),
        ...s,
      },
    });
  }

  console.log("✅ Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
