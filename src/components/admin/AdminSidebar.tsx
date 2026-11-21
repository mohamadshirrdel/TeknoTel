"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Smartphone,
  ShoppingCart,
  Users,
  Store,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";

const links = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: Tags },
  { href: "/admin/numbers", label: "سیم‌کارت‌ها", icon: Smartphone },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { href: "/admin/users", label: "کاربران", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-fit w-full border-b border-border bg-card text-ink md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-l">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20">
            <Store className="size-6" />
          </div>

          <div>
            <div className="text-lg font-black text-ink">
              تکنو<span className="text-brand">تل</span>
            </div>

            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <ShieldCheck className="size-3.5 text-brand" />
              پنل مدیریت
            </div>
          </div>
        </Link>

        <span className="hidden rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-600 dark:text-green-400 md:inline-flex">
          مدیر سیستم
        </span>
      </div>

      {/* Navigation */}
      <div className="px-3 pb-3 md:px-4 md:pb-5">
        <p className="mb-3 hidden px-3 text-[11px] font-bold text-muted md:block">
          منوی مدیریت
        </p>

        <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:flex md:flex-col md:gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;

            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl px-1 py-3 text-center text-[11px] font-semibold transition-all sm:px-2 md:flex-row md:justify-between md:gap-3 md:px-3 md:py-3 md:text-sm md:text-right ${
                  active
                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                    : "text-muted hover:bg-surface hover:text-brand"
                }`}
              >
                <span className="flex min-w-0 flex-col items-center gap-1.5 md:flex-row md:gap-3">
                  <Icon className="size-5 shrink-0" />
                  <span className="break-words">{link.label}</span>
                </span>

                {active && (
                  <ChevronLeft className="hidden size-4 shrink-0 md:block" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Back to Store */}
      <div className="border-t border-border p-3 md:mx-4 md:mt-3 md:px-0">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-brand md:justify-start"
        >
          <Store className="size-5" />
          <span>بازگشت به فروشگاه</span>
          <ChevronLeft className="mr-auto size-4" />
        </Link>
      </div>

      {/* Footer */}
      <div className="hidden px-6 pb-5 pt-2 md:block">
        <p className="text-center text-[10px] text-muted">
          Teknolife Admin Panel
        </p>
      </div>
    </aside>
  );
}
