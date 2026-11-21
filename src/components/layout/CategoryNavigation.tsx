"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Menu,
  X,
  ChevronDown,
  Smartphone,
  CreditCard,
  Headphones,
  Cpu,
} from "lucide-react";

const nav = [
  {
    href: "/category/phones",
    label: "گوشی موبایل",
    icon: Smartphone,
  },
  {
    href: "/numbers",
    label: "سیم‌کارت",
    icon: CreditCard,
  },
  {
    href: "/category/accessories",
    label: "لوازم جانبی",
    icon: Headphones,
  },
  {
    href: "/category/parts",
    label: "قطعات موبایل",
    icon: Cpu,
  },
];

export default function CategoryNavigation() {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const menuRef = useRef<HTMLElement>(null);

  // تشخیص دسته‌بندی فعال
  const isActive = (href: string) => {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }

    // مسیرهای قدیمی زیرمجموعه لوازم جانبی
    if (href === "/category/accessories") {
      return (
        pathname.startsWith("/category/chargers") ||
        pathname.startsWith("/category/handsfree")
      );
    }

    return false;
  };

  // بستن منو با کلیک بیرون یا فشردن Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <nav
      ref={menuRef}
      aria-label="دسته‌بندی محصولات"
      className="border-t border-gray-100 dark:border-gray-800"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        {/* منوی موبایل و تبلت */}
        <div className="relative py-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="mobile-category-menu"
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 transition hover:border-brand/40 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-2">
              {open ? (
                <X className="size-5 text-brand" />
              ) : (
                <Menu className="size-5 text-brand" />
              )}
              دسته‌بندی محصولات
            </span>

            <ChevronDown
              className={`size-4 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* محتوای منوی موبایل */}
          {open && (
            <div
              id="mobile-category-menu"
              className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-3 px-1 text-xs font-bold text-gray-400">
                انتخاب دسته‌بندی
              </div>

              <div className="grid grid-cols-2 gap-2">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition sm:text-sm ${
                        active
                          ? "border-brand/30 bg-red-50 text-brand dark:bg-red-950/30"
                          : "border-gray-100 bg-gray-50 text-gray-700 hover:border-brand/30 hover:bg-red-50 hover:text-brand dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* منوی دسکتاپ */}
        <ul className="hidden items-center justify-between gap-5 py-3 text-sm font-medium text-gray-600 lg:flex dark:text-gray-300">
          {nav.map((item) => {
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap transition hover:text-brand ${
                    active ? "font-bold text-brand" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
