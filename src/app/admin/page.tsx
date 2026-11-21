import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SalesChart from "@/components/admin/SalesChart";

import {
  Users,
  Package,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

const orderStatus: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: "در انتظار پرداخت",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  },
  PAID: {
    label: "پرداخت موفق",
    color:
      "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  },
  PROCESSING: {
    label: "در حال پردازش",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  SHIPPED: {
    label: "ارسال شده",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  },
  DELIVERED: {
    label: "تحویل شده",
    color:
      "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  },
  CANCELED: {
    label: "لغو شده",
    color: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

export default async function AdminHome() {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const [users, products, orders, sales, lowStock, recent, payments] =
    await Promise.all([
      prisma.user.count(),

      prisma.product.count(),

      prisma.order.count(),

      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),

      prisma.product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          stock: true,
        },
      }),

      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          User: {
            select: {
              phone: true,
              name: true,
            },
          },
        },
      }),

      prisma.payment.findMany({
        where: {
          status: "PAID",
          verifiedAt: {
            gte: fiveYearsAgo,
            not: null,
          },
        },
        select: {
          amount: true,
          verifiedAt: true,
        },
        orderBy: {
          verifiedAt: "asc",
        },
      }),
    ]);

  const cards = [
    {
      label: "مجموع فروش موفق",
      value: fa(sales._sum.amount ?? 0),
      suffix: "تومان",
      icon: Wallet,
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      label: "تعداد سفارش‌ها",
      value: fa(orders),
      suffix: "سفارش",
      icon: ShoppingCart,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "تعداد کاربران",
      value: fa(users),
      suffix: "کاربر",
      icon: Users,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      label: "تعداد محصولات",
      value: fa(products),
      suffix: "محصول",
      icon: Package,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

  const chartPayments = payments
    .filter((payment) => payment.verifiedAt !== null)
    .map((payment) => ({
      date: payment.verifiedAt!.toISOString(),
      amount: payment.amount,
    }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">داشبورد مدیریت</h1>

          <p className="mt-2 text-sm text-muted">
            نمای کلی عملکرد فروشگاه تکنوتل
          </p>
        </div>

        <div className="text-xs text-muted">
          {new Date().toLocaleDateString("fa-IR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex size-11 items-center justify-center rounded-2xl ${card.color}`}
                >
                  <Icon className="size-5" />
                </div>
              </div>

              <p className="mt-5 text-xs font-medium text-muted sm:text-sm">
                {card.label}
              </p>

              <p className="mt-2 break-words text-xl font-black text-ink sm:text-2xl">
                {card.value}
              </p>

              <p className="mt-1 text-[11px] text-muted">{card.suffix}</p>
            </div>
          );
        })}
      </div>

      {/* Sales Chart */}
      <SalesChart payments={chartPayments} now={new Date().toISOString()} />

      {/* Inventory & Orders */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Low Stock */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <AlertTriangle className="size-5" />
              </div>

              <div>
                <h2 className="font-black text-ink">موجودی انبار</h2>

                <p className="mt-1 text-xs text-muted">محصولات با موجودی کم</p>
              </div>
            </div>

            <Link
              href="/admin/products"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              مشاهده همه
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">
              محصولی با موجودی کم وجود ندارد.
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted">
                      <Package className="size-4" />
                    </div>

                    <span className="line-clamp-1 text-sm font-semibold text-ink">
                      {product.title}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                      product.stock === 0
                        ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        : "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                    }`}
                  >
                    {product.stock === 0
                      ? "ناموجود"
                      : `${fa(product.stock)} عدد`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Orders */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <ShoppingCart className="size-5" />
              </div>

              <div>
                <h2 className="font-black text-ink">آخرین سفارش‌ها</h2>

                <p className="mt-1 text-xs text-muted">
                  جدیدترین سفارش‌های ثبت‌شده
                </p>
              </div>
            </div>

            <Link
              href="/admin/orders"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              مشاهده همه
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">
              هنوز سفارشی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((order) => {
                const status = orderStatus[order.status];

                return (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 rounded-2xl bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {order.User.name || order.User.phone || "کاربر"}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                      <span className="text-sm font-black text-ink">
                        {fa(order.total)} تومان
                      </span>

                      <span
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                          status?.color ?? "bg-surface text-muted"
                        }`}
                      >
                        {status?.label ?? order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
