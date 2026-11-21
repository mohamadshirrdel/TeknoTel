import Link from "next/link";
import {
  Send,
  Phone,
  ShieldCheck,
  Headphones,
  ShoppingBag,
  ChevronLeft,
} from "lucide-react";

const quickLinks = [
  { title: "صفحه اصلی", href: "/" },
  { title: "فروشگاه", href: "/search" },
  { title: "سیم‌کارت‌ها", href: "/numbers" },
  { title: "سبد خرید", href: "/cart" },
  { title: "حساب کاربری", href: "/dashboard" },
];

const customerLinks = [
  { title: "پیگیری سفارش", href: "/dashboard/orders" },
  { title: "آدرس‌های من", href: "/dashboard/addresses" },
  { title: "سوالات متداول", href: "/faq" },
  { title: "تماس با ما", href: "/contact" },
  { title: "درباره ما", href: "/about" },
];

const trustItems = [
  { title: "نماد اعتماد الکترونیکی" },
  { title: "مجوز فروشگاه" },
  { title: "نشان اعتماد" },
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      {/* محتوای اصلی فوتر */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* معرفی فروشگاه */}
          <div className="space-y-5">
            <Link
              href="/"
              className="inline-flex items-center text-2xl font-black tracking-tight"
            >
              <span className="text-brand">تکنو</span>
              <span className="text-ink">تل</span>
            </Link>

            <p className="max-w-sm text-sm leading-7 text-muted">
              تجربه‌ای آسان، مطمئن و لذت‌بخش از خرید آنلاین موبایل، لوازم جانبی
              و سیم‌کارت. تکنوتل همراه شما برای انتخاب بهتر.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="اینستاگرام"
                className="grid size-10 place-items-center rounded-xl border border-border text-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand"
              >
                <ShoppingBag className="size-5" />
              </a>

              <a
                href="#"
                aria-label="تلگرام"
                className="grid size-10 place-items-center rounded-xl border border-border text-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand"
              >
                <Send className="size-5" />
              </a>
            </div>
          </div>

          {/* دسترسی سریع */}
          <div>
            <h3 className="mb-5 text-base font-bold text-ink">دسترسی سریع</h3>

            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1.5 text-sm text-muted transition hover:text-brand"
                  >
                    <ChevronLeft className="size-4 transition group-hover:-translate-x-1" />
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* خدمات مشتریان */}
          <div>
            <h3 className="mb-5 text-base font-bold text-ink">خدمات مشتریان</h3>

            <ul className="space-y-3">
              {customerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1.5 text-sm text-muted transition hover:text-brand"
                  >
                    <ChevronLeft className="size-4 transition group-hover:-translate-x-1" />
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* نمادهای اعتماد */}
          <div>
            <h3 className="mb-5 text-base font-bold text-ink">
              اعتماد و اطمینان
            </h3>

            <p className="mb-4 text-sm leading-6 text-muted">
              برای خریدی مطمئن، نمادها و مجوزهای فروشگاه در این بخش قرار خواهند
              گرفت.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {trustItems.map((item, index) => (
                <div
                  key={index}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-2 py-3 text-center transition hover:border-brand/50"
                >
                  <ShieldCheck className="size-6 text-muted" />

                  <span className="text-[10px] leading-4 text-muted sm:text-xs">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* اطلاعات تماس */}
        <div className="mt-10 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Headphones className="size-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-ink">پشتیبانی مشتریان</p>
              <p className="mt-1 text-xs text-muted">
                پاسخگوی سوالات و مشکلات شما
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:justify-end">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Phone className="size-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-ink">ارتباط با ما</p>
              <p className="mt-1 text-xs text-muted">
                برای ارتباط با پشتیبانی تماس بگیرید
              </p>
            </div>
          </div>
        </div>

        {/* نوار پایانی */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center sm:flex-row sm:text-right">
          <p className="text-xs leading-6 text-muted">
            © {new Date().getFullYear()} تکنوتل | تمامی حقوق محفوظ است.
          </p>

          <p className="text-xs text-muted">
            ساخته شده با ❤️ برای تجربه بهتر خرید آنلاین
          </p>
        </div>
      </div>
    </footer>
  );
}
