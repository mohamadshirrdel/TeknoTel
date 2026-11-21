"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShoppingCart,
  ArrowLeft,
  Package,
  ShieldCheck,
  Truck,
  CreditCard,
  Tag,
} from "lucide-react";

import { useCart, getCartItemId } from "@/store/cart";

const fa = (n: number) => n.toLocaleString("fa-IR");

const noop = () => () => {};

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const total = items.reduce((sum, item) => {
    return sum + item.price * item.qty;
  }, 0);

  const itemCount = items.reduce((sum, item) => {
    return sum + item.qty;
  }, 0);

  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  // Loading State
  if (!mounted) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-10 w-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-48 rounded-3xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  // Empty Cart
  if (items.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="relative mb-6">
          <div className="grid size-28 place-items-center rounded-full bg-red-50 dark:bg-red-950/30">
            <ShoppingBag className="size-12 text-brand" />
          </div>

          <span className="absolute -bottom-1 -left-1 grid size-9 place-items-center rounded-full border-4 border-white bg-gray-100 text-gray-400 dark:border-gray-900 dark:bg-gray-800">
            <ShoppingCart className="size-4" />
          </span>
        </div>

        <h1 className="text-xl font-black text-gray-900 dark:text-white">
          سبد خرید شما خالی است!
        </h1>

        <p className="mt-3 max-w-sm text-sm leading-7 text-gray-500 dark:text-gray-400">
          هنوز محصولی به سبد خرید اضافه نکرده‌اید.
          برای مشاهده محصولات فروشگاه می‌توانید به صفحه اصلی برگردید.
        </p>

        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-xl"
        >
          مشاهده محصولات
          <ArrowLeft className="size-4" />
        </Link>

      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 sm:space-y-8">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <div className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-xl bg-red-50 text-brand dark:bg-red-950/30">
              <ShoppingCart className="size-5" />
            </div>

            <h1 className="text-xl font-black text-gray-900 sm:text-2xl dark:text-white">
              سبد خرید
            </h1>
          </div>

          <p className="mt-2 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
            محصولات انتخاب‌شده برای خرید شما
          </p>
        </div>

        <span className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-brand dark:bg-red-950/30 sm:text-sm">
          {fa(itemCount)} کالا
        </span>

      </div>

      {/* Main Content */}
      <div className="grid items-start gap-6 lg:grid-cols-3">

        {/* Cart Items */}
        <section className="space-y-4 lg:col-span-2">

          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 dark:text-white">
              محصولات سبد خرید
            </h2>

            <span className="text-xs text-gray-400 dark:text-gray-500">
              {fa(items.length)} نوع محصول
            </span>
          </div>

          {items.map((item) => {
            const cartItemId =
              item.cartItemId || getCartItemId(item);

            return (
              <article
                key={cartItemId}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-gray-200 hover:shadow-md sm:p-5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              >

                <div className="flex gap-3 sm:gap-5">

                  {/* Product Icon */}
                  <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gray-50 text-gray-400 sm:size-20 dark:bg-gray-800 dark:text-gray-500">
                    {item.kind === "sim" ? (
                      <CreditCard className="size-8" />
                    ) : (
                      <Package className="size-8" />
                    )}
                  </div>

                  {/* Product Information */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-2">

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-sm leading-7 font-bold text-gray-900 sm:text-base dark:text-white">
                          {item.title}
                        </h3>

                        {item.kind === "sim" && (
                          <span className="mt-1 inline-flex rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                            سیم‌کارت
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(cartItemId)}
                        aria-label="حذف محصول"
                        title="حذف محصول"
                        className="grid size-9 shrink-0 place-items-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-brand dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="size-4" />
                      </button>

                    </div>

                    {/* Selected Options */}
                    {item.kind === "product" &&
                      item.selectedOptions &&
                      item.selectedOptions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.selectedOptions.map((option, index) => (
                            <span
                              key={`${option.name}-${index}`}
                              className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {option.name}: {option.value}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Price & Quantity */}
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">

                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          قیمت واحد
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900 dark:text-white">
                          {fa(item.price)}
                          <span className="mr-1 text-[11px] font-normal text-gray-500 dark:text-gray-400">
                            تومان
                          </span>
                        </p>
                      </div>

                      {item.kind === "product" ? (
                        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">

                          <button
                            type="button"
                            onClick={() =>
                              setQty(cartItemId, item.qty + 1)
                            }
                            aria-label="افزایش تعداد"
                            className="grid size-8 place-items-center rounded-lg text-gray-600 transition hover:bg-white hover:text-brand dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Plus className="size-4" />
                          </button>

                          <span className="min-w-8 text-center text-sm font-bold text-gray-900 dark:text-white">
                            {fa(item.qty)}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setQty(cartItemId, item.qty - 1)
                            }
                            aria-label="کاهش تعداد"
                            className="grid size-8 place-items-center rounded-lg text-gray-600 transition hover:bg-white hover:text-brand dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Minus className="size-4" />
                          </button>

                        </div>
                      ) : (
                        <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          یک عدد
                        </span>
                      )}

                    </div>

                    {/* Item Total */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">

                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        مجموع این محصول
                      </span>

                      <span className="text-sm font-black text-brand">
                        {fa(item.price * item.qty)}
                        <span className="mr-1 text-[11px] font-normal">
                          تومان
                        </span>
                      </span>

                    </div>

                  </div>
                </div>

              </article>
            );
          })}

          {/* Continue Shopping */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-brand/40 hover:text-brand dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand/40"
          >
            <ArrowLeft className="size-4" />
            ادامه خرید
          </Link>

        </section>

        {/* Order Summary */}
        <aside className="h-fit space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-32 dark:border-gray-800 dark:bg-gray-900">

          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-gray-800">
            <div className="grid size-10 place-items-center rounded-xl bg-red-50 text-brand dark:bg-red-950/30">
              <ShoppingBag className="size-5" />
            </div>

            <h2 className="font-black text-gray-900 dark:text-white">
              خلاصه سفارش
            </h2>
          </div>

          {/* Item Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              تعداد کالا
            </span>

            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {fa(itemCount)} عدد
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              جمع مبلغ محصولات
            </span>

            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {fa(total)} تومان
            </span>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Tag className="size-4" />
              تخفیف
            </span>

            <span className="font-semibold text-gray-500 dark:text-gray-400">
              محاسبه در قیمت محصولات
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

          {/* Final Price */}
          <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/20">

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                مبلغ قابل پرداخت
              </span>

              <span className="text-lg font-black text-brand">
                {fa(total)}
              </span>
            </div>

            <p className="mt-2 text-left text-[11px] text-gray-500 dark:text-gray-400">
              تومان
            </p>

          </div>

          {/* Checkout Button */}
          <Link
            href="/checkout"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-xl"
          >
            ادامه فرایند خرید
            <ArrowLeft className="size-4" />
          </Link>

          {/* Benefits */}
          <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ShieldCheck className="size-4 shrink-0 text-green-600 dark:text-green-400" />
              خرید آسان و مطمئن
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Truck className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              ارسال طبق شرایط فروشگاه
            </div>

          </div>

        </aside>

      </div>
    </div>
  );
}