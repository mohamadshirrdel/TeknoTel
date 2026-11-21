import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PayButton from "@/components/shop/PayButton";
import PaymentSuccessHandler from "@/components/shop/PaymentSuccessHandler";

import {
  ShoppingBag,
  Package,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  PackageCheck,
  CreditCard,
  Receipt,
  CalendarDays,
} from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

const statusConfig: Record<
  string,
  { title: string; className: string; Icon: typeof CheckCircle2 }
> = {
  PENDING: {
    title: "در انتظار پرداخت",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    Icon: Clock3,
  },
  PAID: {
    title: "پرداخت‌شده",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
    Icon: CheckCircle2,
  },
  PROCESSING: {
    title: "در حال پردازش",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    Icon: Package,
  },
  SHIPPED: {
    title: "ارسال‌شده",
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900",
    Icon: Truck,
  },
  DELIVERED: {
    title: "تحویل‌شده",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
    Icon: PackageCheck,
  },
  CANCELED: {
    title: "لغوشده",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
    Icon: XCircle,
  },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ pay?: string; orderId?: string }>;
}) {
  const { pay, orderId } = await searchParams;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      OrderItem: {
        include: {
          Product: true,
          SimNumber: true,
        },
      },
    },
  });

  const successfulOrderId =
    (pay === "ok" || pay === "done") &&
    orderId &&
    orders.some((order) => order.id === orderId && order.status === "PAID")
      ? orderId
      : undefined;

  const paidCount = orders.filter((order) => order.status === "PAID").length;

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-10">
      <PaymentSuccessHandler pay={pay} orderId={successfulOrderId} />

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8">
        <div className="absolute -left-16 -top-20 size-56 rounded-full bg-brand/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-brand">
              <Receipt className="size-5" />
              <span className="text-sm font-bold">پنل کاربری</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">
              سفارش‌های من
            </h1>

            <p className="mt-2 text-sm leading-7 text-gray-500 dark:text-gray-400">
              در این قسمت می‌توانید سفارش‌ها و وضعیت خریدهای خود را مشاهده کنید.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            <ShoppingBag className="size-4" />
            ادامه خرید
            <ArrowLeft className="size-4" />
          </Link>
        </div>

        {/* Statistics */}
        <div className="relative mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
            <div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <ShoppingBag className="size-5" />
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                کل سفارش‌ها
              </p>
              <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                {fa(orders.length)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
            <div className="grid size-11 place-items-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400">
              <CheckCircle2 className="size-5" />
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                سفارش‌های پرداخت‌شده
              </p>
              <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                {fa(paidCount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
            <div className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Clock3 className="size-5" />
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                در انتظار پرداخت
              </p>
              <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                {fa(pendingCount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Messages */}
      {pay === "ok" && successfulOrderId && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="size-6 shrink-0" />
          <div>
            <p className="font-bold">پرداخت با موفقیت انجام شد!</p>
            <p className="mt-1 text-xs opacity-80">
              سفارش شما با موفقیت ثبت و پرداخت شد.
            </p>
          </div>
        </div>
      )}

      {pay === "failed" && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <XCircle className="size-6 shrink-0" />
          <div>
            <p className="font-bold">پرداخت ناموفق بود</p>
            <p className="mt-1 text-xs opacity-80">
              می‌توانید برای سفارش‌های در انتظار پرداخت دوباره تلاش کنید.
            </p>
          </div>
        </div>
      )}

      {pay === "expired" && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          <Clock3 className="size-6 shrink-0" />
          <div>
            <p className="font-bold">مهلت پرداخت به پایان رسید</p>
            <p className="mt-1 text-xs opacity-80">
              سفارش لغو شده است. لطفاً دوباره سفارش دهید.
            </p>
          </div>
        </div>
      )}

      {pay === "pending" && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          <Clock3 className="size-6 shrink-0" />
          <div>
            <p className="font-bold">وضعیت پرداخت هنوز مشخص نیست</p>
            <p className="mt-1 text-xs opacity-80">
              لطفاً کمی بعد دوباره وضعیت سفارش خود را بررسی کنید.
            </p>
          </div>
        </div>
      )}

      {/* Orders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            تاریخچه سفارش‌ها
          </h2>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {fa(orders.length)} سفارش
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white px-5 py-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-5 grid size-20 place-items-center rounded-full bg-brand/10 text-brand">
              <ShoppingBag className="size-9" />
            </div>

            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              هنوز سفارشی ثبت نکرده‌اید
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-7 text-gray-500 dark:text-gray-400">
              بعد از خرید محصولات، سفارش‌های شما در این قسمت نمایش داده می‌شوند.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              مشاهده محصولات
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const status = statusConfig[order.status] ?? {
              title: order.status,
              className:
                "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
              Icon: Clock3,
            };

            const StatusIcon = status.Icon;

            const itemCount = order.OrderItem.reduce(
              (sum, item) => sum + item.qty,
              0,
            );

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              >
                {/* Order Header */}
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                      <Package className="size-5" />
                    </div>

                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        سفارش شماره {order.id.slice(-8)}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <CalendarDays className="size-3.5" />
                        {new Intl.DateTimeFormat("fa-IR").format(
                          order.createdAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold ${status.className}`}
                  >
                    <StatusIcon className="size-4" />
                    {status.title}
                  </span>
                </div>

                {/* Products */}
                <div className="space-y-3 p-5">
                  {order.OrderItem.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800/70"
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                        <Package className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-200">
                          {item.Product?.title ??
                            `سیم‌کارت ${item.SimNumber?.number}`}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          تعداد: {fa(item.qty)}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        × {fa(item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50/70 p-5 dark:border-gray-700 dark:bg-gray-800/40 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      مبلغ نهایی سفارش
                    </p>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-black text-gray-900 dark:text-white">
                        {fa(order.total)}
                      </span>

                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        تومان
                      </span>
                    </div>
                  </div>

                  {order.status === "PENDING" && (
                    <div className="w-full sm:w-auto sm:min-w-44">
                      <PayButton orderId={order.id} />
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
