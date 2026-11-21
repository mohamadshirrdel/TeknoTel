"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  ChevronLeft,
} from "lucide-react";

const links = [
  {
    href: "/dashboard",
    label: "پیشخوان",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/orders",
    label: "سفارش‌های من",
    icon: ShoppingBag,
  },
  {
    href: "/dashboard/addresses",
    label: "آدرس‌های من",
    icon: MapPin,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-fit overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-3">
      {/* عنوان پنل - فقط دسکتاپ */}
      <div className="mb-3 hidden px-3 py-3 md:block">
        <h2 className="text-base font-black text-gray-900 dark:text-white">
          پنل کاربری
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          مدیریت حساب و سفارش‌ها
        </p>
      </div>

      <nav className="grid grid-cols-3 gap-2 md:flex md:flex-col">
        {links.map((link) => {
          const Icon = link.icon;

          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl px-1 py-3 text-center text-[11px] font-semibold leading-5 transition-all sm:text-xs md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3 md:text-sm md:text-right ${
                active
                  ? "bg-brand text-white shadow-md shadow-brand/20"
                  : "text-gray-600 hover:bg-gray-100 hover:text-brand dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand"
              }`}
            >
              <span className="flex min-w-0 flex-col items-center gap-1.5 md:flex-row md:gap-3">
                <Icon className="size-5 shrink-0 md:size-5" />

                <span className="break-words">
                  {link.label}
                </span>
              </span>

              {active && (
                <ChevronLeft className="hidden size-4 shrink-0 md:block" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}