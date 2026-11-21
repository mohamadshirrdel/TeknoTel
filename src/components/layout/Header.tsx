import Link from "next/link";

import { ShoppingCart, UserRound, LogOut } from "lucide-react";

import { auth, signOut } from "@/auth";

import CartBadge from "@/components/layout/CartBadge";
import SearchBox from "@/components/layout/SearchBox";
import ThemeToggle from "@/components/layout/ThemeToggle";
import CategoryNavigation from "@/components/layout/CategoryNavigation";

export default async function Header() {
  const session = await auth();

  const user = session?.user as
    | { phone?: string; name?: string; role?: string }
    | undefined;

  const userPhone = user?.phone;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        {/* ردیف اصلی */}
        <div className="flex items-center gap-3 py-3 sm:gap-5 md:py-4">
          {/* لوگو */}
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl"
          >
            <span className="text-brand">تکنو</span>
            <span className="text-gray-900 dark:text-white">تل</span>
          </Link>

          {/* جست‌وجوی دسکتاپ */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBox />
          </div>

          {/* دکمه‌های کاربری */}
          <div className="mr-auto flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden h-11 max-w-48 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 transition hover:border-brand/40 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 sm:flex"
                >
                  <UserRound className="size-5 shrink-0 text-brand" />

                  <span
                    dir="ltr"
                    className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100"
                  >
                    {userPhone || user.name || "حساب کاربری"}
                  </span>
                </Link>

                <Link
                  href="/dashboard"
                  aria-label="حساب کاربری"
                  className="grid size-10 place-items-center rounded-xl border border-gray-200 text-gray-700 transition hover:border-brand/40 hover:bg-red-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:hidden"
                >
                  <UserRound className="size-5" />
                </Link>

                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    title="خروج از حساب"
                    aria-label="خروج از حساب"
                    className="hidden size-10 place-items-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-brand dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:grid"
                  >
                    <LogOut className="size-5" />
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand/40 hover:bg-red-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:px-3"
              >
                <UserRound className="size-5" />
                <span className="hidden sm:inline">ورود | ثبت‌نام</span>
              </Link>
            )}

            {/* تغییر تم */}
            <ThemeToggle />

            {/* سبد خرید */}
            <Link
              href="/cart"
              aria-label="سبد خرید"
              className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-dark sm:size-11"
            >
              <ShoppingCart className="size-5" />
              <CartBadge />
            </Link>
          </div>
        </div>

        {/* جست‌وجوی موبایل */}
        <div className="pb-3 md:hidden">
          <SearchBox />
        </div>
      </div>

      {/* دسته‌بندی محصولات */}
      <CategoryNavigation />
    </header>
  );
}
