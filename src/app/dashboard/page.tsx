import { auth } from "@/auth";
import {
  UserRound,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { phone?: string; name?: string } | undefined;

  const displayName = user?.name ?? user?.phone ?? "کاربر عزیز";

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8">
        <div className="absolute -left-16 -top-16 size-56 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">
              <Sparkles className="size-4" />
              پنل کاربری تکنوتل
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">
              خوش آمدید 👋
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
              به حساب کاربری خود خوش آمدید. از این قسمت می‌توانید سفارش‌ها و
              اطلاعات حساب خود را مدیریت کنید.
            </p>

            <p
              dir="ltr"
              className="mt-4 w-fit rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {displayName}
            </p>
          </div>

          <div className="grid size-24 shrink-0 place-items-center self-center rounded-3xl bg-brand/10 text-brand sm:size-32">
            <UserRound className="size-12 sm:size-16" />
          </div>
        </div>
      </section>

      {/* Account Information */}
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h2 className="font-black text-gray-900 dark:text-white">
              مدیریت حساب کاربری
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              دسترسی سریع به بخش‌های حساب شما
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/orders"
            className="group flex items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-brand/40 hover:bg-brand/5 dark:border-gray-700 dark:hover:border-brand/40 dark:hover:bg-brand/5"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <ShoppingBag className="size-5" />
              </div>

              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                سفارش‌های من
              </span>
            </div>

            <ArrowLeft className="size-4 text-gray-400 transition group-hover:-translate-x-1 group-hover:text-brand" />
          </Link>

          <Link
            href="/dashboard/addresses"
            className="group flex items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-brand/40 hover:bg-brand/5 dark:border-gray-700 dark:hover:border-brand/40 dark:hover:bg-brand/5"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                <MapPin className="size-5" />
              </div>

              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                آدرس‌های من
              </span>
            </div>

            <ArrowLeft className="size-4 text-gray-400 transition group-hover:-translate-x-1 group-hover:text-brand" />
          </Link>
        </div>
      </section>
    </div>
  );
}
