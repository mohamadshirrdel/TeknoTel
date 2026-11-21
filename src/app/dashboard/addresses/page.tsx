import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import {
  MapPin,
  MapPinned,
  Package,
  Hash,
  Navigation,
} from "lucide-react";

export default async function AddressesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { id: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-7">
        <div className="absolute -left-12 -top-16 size-48 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
            <MapPinned className="size-7" />
          </div>

          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white sm:text-2xl">
              آدرس‌های من
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              آدرس‌های ثبت‌شده برای دریافت سفارش‌های شما
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <MapPin className="size-4 shrink-0 text-brand" />

          <span>
            تعداد آدرس‌های ثبت‌شده:
            <strong className="mr-1 text-gray-900 dark:text-white">
              {addresses.length.toLocaleString("fa-IR")}
            </strong>
          </span>
        </div>
      </section>

      {/* Address List */}
      {addresses.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 grid size-20 place-items-center rounded-full bg-brand/10 text-brand">
            <MapPin className="size-9" />
          </div>

          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            هنوز آدرسی ثبت نکرده‌اید
          </h2>

          <p className="mt-3 max-w-sm text-sm leading-7 text-gray-500 dark:text-gray-400">
            هنگام ثبت سفارش می‌توانید آدرس جدید خود را وارد کنید.
            آدرس‌های شما در این قسمت نمایش داده خواهند شد.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="font-black text-gray-900 dark:text-white">
            آدرس‌های ثبت‌شده
          </h2>

          {addresses.map((address) => (
            <article
              key={address.id}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 p-5 dark:border-gray-700">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <MapPin className="size-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-black text-gray-900 dark:text-white">
                    {address.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    آدرس تحویل سفارش
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <Navigation className="mt-1 size-4 shrink-0 text-brand" />

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      موقعیت
                    </p>

                    <p className="mt-1 text-sm leading-7 text-gray-800 dark:text-gray-200">
                      {address.province}، {address.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinned className="mt-1 size-4 shrink-0 text-brand" />

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      نشانی کامل
                    </p>

                    <p className="mt-1 text-sm leading-7 text-gray-800 dark:text-gray-200">
                      {address.street}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <Hash className="size-4 shrink-0 text-brand" />

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      کد پستی
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-sm font-bold text-gray-800 dark:text-gray-200"
                    >
                      {address.postalCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-5 py-3 text-xs text-gray-500 dark:bg-gray-800/70 dark:text-gray-400">
                <Package className="size-4" />
                آدرس ذخیره‌شده در حساب کاربری شما
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}