import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Smartphone,
  Headphones,
  Cable,
  Cpu,
  CreditCard,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Truck,
  Headset,
  PackageCheck,
  ShoppingBag,
  Flame,
  Tags,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const categories: {
  name: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}[] = [
  {
    name: "گوشی موبایل",
    href: "/category/phones",
    icon: Smartphone,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
  {
    name: "سیم‌کارت",
    href: "/numbers",
    icon: CreditCard,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    name: "لوازم جانبی",
    href: "/category/accessories",
    icon: Headphones,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
  {
    name: "قطعات موبایل",
    href: "/category/parts",
    icon: Cpu,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
];

const advantages = [
  {
    title: "ارسال سریع",
    description: "ارسال سفارش‌ها در کوتاه‌ترین زمان",
    icon: Truck,
  },
  {
    title: "ضمانت اصالت کالا",
    description: "خرید با اطمینان و خیال راحت",
    icon: ShieldCheck,
  },
  {
    title: "پشتیبانی مشتریان",
    description: "همراه شما در تمام مراحل خرید",
    icon: Headset,
  },
  {
    title: "بسته‌بندی مطمئن",
    description: "محافظت از سفارش تا زمان تحویل",
    icon: PackageCheck,
  },
];

const successfulOrderStatuses = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

const availableProductWhere = {
  OR: [
    {
      stock: { gt: 0 },
      ProductVariant: {
        none: {},
      },
    },
    {
      ProductVariant: {
        some: {
          isActive: true,
          stock: { gt: 0 },
        },
      },
    },
  ],
};

export default async function Home() {
  const latestProducts = await prisma.product.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const featuredProducts = await prisma.product.findMany({
    where: {
      discount: { gt: 0 },
      ...availableProductWhere,
    },
    orderBy: [{ discount: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  const bestSellerGroups = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      Order: {
        status: {
          in: [...successfulOrderStatuses],
        },
      },
    },
    _sum: {
      qty: true,
    },
    orderBy: {
      _sum: {
        qty: "desc",
      },
    },
    take: 30,
  });

  const bestSellerIds = bestSellerGroups
    .map((item) => item.productId)
    .filter((id): id is string => id !== null);

  const bestSellerProducts = await prisma.product.findMany({
    where: {
      id: { in: bestSellerIds },
      ...availableProductWhere,
    },
  });

  const bestSellerMap = new Map(
    bestSellerProducts.map((product) => [product.id, product]),
  );

  const bestSellers = bestSellerGroups
    .map((item) =>
      item.productId ? bestSellerMap.get(item.productId) : undefined,
    )
    .filter((product) => product !== undefined)
    .slice(0, 5);

  return (
    <div className="space-y-10 pb-8 sm:space-y-12">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-l from-[#d92e43] via-brand to-[#ff6877] px-5 py-10 text-white sm:px-8 sm:py-12 md:rounded-[2rem] md:px-14 md:py-16">
        <div className="absolute -left-16 -top-20 -z-10 size-72 rounded-full border-[35px] border-white/10" />
        <div className="absolute -bottom-32 right-1/3 -z-10 size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium sm:text-sm">
              <Sparkles className="size-4" />
              <span>دنیای تکنولوژی در دستان شما</span>
            </div>

            <h1 className="text-2xl leading-[1.7] font-black sm:text-3xl md:text-5xl md:leading-[1.5]">
              هر چیزی که از دنیای موبایل می‌خوای!
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-8 text-white/90 md:text-base">
              از جدیدترین گوشی‌های هوشمند تا لوازم جانبی، قطعات موبایل و
              سیم‌کارت‌های رند 0912؛ همه را در تکنوتل پیدا کن.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 sm:mt-8">
              <Link
                href="/category/phones"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand transition hover:bg-gray-100 sm:px-6"
              >
                مشاهده محصولات
                <ArrowLeft className="size-4" />
              </Link>

              <Link
                href="/numbers"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:px-6"
              >
                سیم‌کارت 0912
              </Link>
            </div>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="relative flex size-64 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm lg:size-80">
              <div className="absolute inset-5 rounded-full border border-white/20" />

              <div className="flex size-44 items-center justify-center rounded-[2.5rem] bg-white/15 shadow-2xl backdrop-blur-md lg:size-56">
                <Smartphone className="size-24 stroke-[1.2] lg:size-28" />
              </div>

              <div className="absolute -right-3 top-12 rounded-2xl bg-white p-4 text-brand shadow-xl">
                <Headphones className="size-8" />
              </div>

              <div className="absolute -bottom-2 left-5 rounded-2xl bg-white p-4 text-brand shadow-xl">
                <Cable className="size-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="mb-5 sm:mb-6">
          <span className="text-sm font-medium text-brand">
            دسته‌بندی محصولات
          </span>

          <h2 className="mt-1 text-xl font-black text-gray-900 sm:text-2xl dark:text-white">
            چی لازم داری؟
          </h2>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.href}
                href={category.href}
                className="group flex min-w-0 flex-col items-center rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg sm:p-5 md:p-6 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand/40"
              >
                <div
                  className={`mb-3 flex size-14 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110 sm:mb-4 sm:size-16 ${category.bg}`}
                >
                  <Icon
                    className={`size-7 sm:size-8 ${category.color}`}
                    strokeWidth={1.8}
                  />
                </div>

                <h3 className="text-xs font-bold text-gray-800 transition group-hover:text-brand sm:text-sm dark:text-gray-100">
                  {category.name}
                </h3>

                <span className="mt-2 text-[10px] text-gray-400 sm:text-xs dark:text-gray-500">
                  مشاهده محصولات
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Advantages */}
      <section className="grid grid-cols-2 gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-4 md:p-7 dark:border-gray-800 dark:bg-gray-900">
        {advantages.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex min-w-0 items-center gap-3 p-2 md:justify-center"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand sm:size-12 dark:bg-red-950/40">
                <Icon className="size-5 sm:size-6" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs font-bold text-gray-900 sm:text-sm dark:text-gray-100">
                  {item.title}
                </h3>

                <p className="mt-1 text-[10px] leading-5 text-gray-400 sm:text-xs dark:text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
            <div className="min-w-0">
              <span className="flex items-center gap-1 text-xs font-medium text-brand sm:text-sm">
                <Tags className="size-4" />
                تخفیف‌های ویژه
              </span>

              <h2 className="mt-1 text-lg font-black text-gray-900 sm:text-2xl dark:text-white">
                پیشنهادهای ویژه
              </h2>

              <p className="mt-1 text-xs text-gray-400 sm:text-sm dark:text-gray-500">
                محصولات منتخب با قیمت مناسب‌تر
              </p>
            </div>

            <Link
              href="/search?discount=true"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand transition hover:gap-2 sm:text-sm"
            >
              مشاهده همه
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                title={product.title}
                image={product.images[0] ?? "/placeholder.png"}
                price={product.price}
                discount={product.discount}
              />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
            <div className="min-w-0">
              <span className="flex items-center gap-1 text-xs font-medium text-brand sm:text-sm">
                <TrendingUp className="size-4" />
                محبوب مشتریان
              </span>

              <h2 className="mt-1 text-lg font-black text-gray-900 sm:text-2xl dark:text-white">
                پرفروش‌ترین محصولات
              </h2>

              <p className="mt-1 text-xs text-gray-400 sm:text-sm dark:text-gray-500">
                محصولاتی که مشتریان بیشتر انتخاب کرده‌اند
              </p>
            </div>

            <Link
              href="/search?sort=bestselling"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand transition hover:gap-2 sm:text-sm"
            >
              مشاهده همه
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {bestSellers.map((product, index) => (
              <div key={product.id} className="relative min-w-0">
                {index === 0 && (
                  <span className="absolute -top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-white shadow sm:right-3 sm:px-3 sm:text-xs">
                    <Flame className="size-3.5" />
                    پرفروش‌ترین
                  </span>
                )}

                <ProductCard
                  slug={product.slug}
                  title={product.title}
                  image={product.images[0] ?? "/placeholder.png"}
                  price={product.price}
                  discount={product.discount}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
          <div>
            <span className="text-xs font-medium text-brand sm:text-sm">
              انتخاب‌های جدید
            </span>

            <h2 className="mt-1 text-lg font-black text-gray-900 sm:text-2xl dark:text-white">
              جدیدترین محصولات
            </h2>
          </div>

          <Link
            href="/category/phones"
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand transition hover:gap-2 sm:text-sm"
          >
            مشاهده همه
            <ArrowLeft className="size-4" />
          </Link>
        </div>

        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                title={product.title}
                image={product.images[0] ?? "/placeholder.png"}
                price={product.price}
                discount={product.discount}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-brand dark:bg-red-950/40">
              <ShoppingBag className="size-8" />
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white">
              هنوز محصولی ثبت نشده است
            </h3>

            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              به‌زودی محصولات جدید در این بخش قرار می‌گیرند.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
