import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";

import ProductVariantSelector from "@/components/shop/ProductVariantSelector";
import ProductSpecs from "@/components/shop/ProductSpecs";
import ProductImageSlider from "@/components/shop/ProductImageSlider";

import {
  Home,
  ChevronLeft,
  Tag,
  ShieldCheck,
  Truck,
  Headset,
  PackageCheck,
  FileText,
  Sparkles,
} from "lucide-react";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
  });

  return {
    title: product?.title ?? "محصول یافت نشد",
    description: product?.description ?? undefined,
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      Category: true,

      ProductOption: {
        orderBy: { position: "asc" },
        include: {
          ProductOptionValue: {
            orderBy: { position: "asc" },
          },
        },
      },

      ProductVariant: {
        where: { isActive: true },
        include: {
          VariantOptionValue: {
            include: {
              ProductOptionValue: {
                include: {
                  ProductOption: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product) notFound();

  const finalPrice = Math.round(product.price * (1 - product.discount / 100));

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 sm:space-y-8">
      {/* Breadcrumb */}
      <nav
        aria-label="مسیر صفحه"
        className="flex flex-wrap items-center gap-2 text-xs sm:text-sm"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-gray-500 transition hover:text-brand dark:text-gray-400"
        >
          <Home className="size-4" />
          خانه
        </Link>

        <ChevronLeft className="size-4 text-gray-300 dark:text-gray-600" />

        <Link
          href={`/category/${product.Category.slug}`}
          className="text-gray-500 transition hover:text-brand dark:text-gray-400"
        >
          {product.Category.name}
        </Link>

        <ChevronLeft className="size-4 text-gray-300 dark:text-gray-600" />

        <span className="max-w-44 truncate font-semibold text-gray-800 dark:text-gray-200 sm:max-w-xs">
          {product.title}
        </span>
      </nav>

      {/* Main Product Section */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute -right-32 -top-32 size-80 rounded-full bg-red-100/60 blur-3xl dark:bg-red-950/20" />

        <div className="relative grid gap-6 p-3 sm:gap-8 sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8">
          {/* Product Gallery */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  تصاویر محصول
                </span>
              </div>

              <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Sparkles className="size-3.5 text-brand" />
                تکنوتل
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-3 sm:p-5 dark:border-gray-800 dark:from-gray-800 dark:to-gray-900">
              <ProductImageSlider
                images={product.images}
                title={product.title}
              />
            </div>

            {/* Gallery Footer */}
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-500 dark:bg-gray-800/70 dark:text-gray-400">
              <ShieldCheck className="size-4 text-green-600 dark:text-green-400" />
              تصاویر مربوط به محصول انتخاب‌شده
            </div>
          </div>

          {/* Product Information */}
          <div className="flex min-w-0 flex-col">
            {/* Category & Brand */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link
                href={`/category/${product.Category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-brand transition hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
              >
                <Tag className="size-3.5" />
                {product.Category.name}
              </Link>

              {product.brand && (
                <span className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  برند: {product.brand}
                </span>
              )}
            </div>

            {/* Product Title */}
            <div className="border-b border-gray-100 pb-5 dark:border-gray-800">
              <h1 className="text-xl leading-9 font-black text-gray-900 sm:text-2xl sm:leading-10 lg:text-3xl lg:leading-[1.8] dark:text-white">
                {product.title}
              </h1>

              <p className="mt-3 text-xs leading-6 text-gray-400 sm:text-sm dark:text-gray-500">
                انتخاب و خرید آسان از فروشگاه تکنوتل
              </p>
            </div>

            {/* Product Specifications */}
            <div className="py-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-red-50 text-brand dark:bg-red-950/30">
                  <PackageCheck className="size-5" />
                </div>

                <div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">
                    مشخصات محصول
                  </h2>

                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    ویژگی‌ها و اطلاعات فنی
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <ProductSpecs
                  colors={product.colors}
                  filterValues={product.filterValues}
                  customFields={product.customFields}
                />
              </div>
            </div>

            {/* Variant Selector & Purchase */}
            <div className="mt-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-red-50 text-brand dark:bg-red-950/30">
                  <Tag className="size-5" />
                </div>

                <div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">
                    انتخاب محصول و خرید
                  </h2>

                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    ابتدا مشخصات موردنظر خود را انتخاب کنید.
                  </p>
                </div>
              </div>

              <ProductVariantSelector
                productId={product.id}
                title={product.title}
                options={product.ProductOption.map((option) => ({
                  id: option.id,
                  name: option.name,
                  values: option.ProductOptionValue,
                }))}
                variants={product.ProductVariant.map((variant) => ({
                  id: variant.id,
                  price: variant.price,
                  discount: variant.discount,
                  stock: variant.stock,
                  values: variant.VariantOptionValue.map((item) => ({
                    optionValue: {
                      id: item.ProductOptionValue.id,
                      optionId: item.ProductOptionValue.optionId,
                      value: item.ProductOptionValue.value,
                      label: item.ProductOptionValue.label,
                      option: {
                        id: item.ProductOptionValue.ProductOption.id,
                        name: item.ProductOptionValue.ProductOption.name,
                      },
                    },
                  })),
                }))}
                fallbackPrice={finalPrice}
                fallbackStock={product.stock}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Shopping Benefits */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Truck className="size-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              ارسال سفارش
            </h3>

            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              ارسال طبق شرایط فروشگاه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              خرید مطمئن
            </h3>

            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              خرید آسان از تکنوتل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
            <Headset className="size-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              پشتیبانی
            </h3>

            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              همراه شما در خرید
            </p>
          </div>
        </div>
      </section>

      {/* Product Description */}
      {product.description && (
        <section className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-7 dark:border-gray-800">
            <div className="grid size-11 place-items-center rounded-2xl bg-red-50 text-brand dark:bg-red-950/30">
              <FileText className="size-5" />
            </div>

            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                توضیحات محصول
              </h2>

              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                اطلاعات تکمیلی درباره {product.title}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <p className="whitespace-pre-line text-sm leading-9 text-gray-600 sm:text-base sm:leading-10 dark:text-gray-300">
              {product.description}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
