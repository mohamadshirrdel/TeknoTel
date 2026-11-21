import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/actions/admin";
import {
  ShoppingBag,
  UserRound,
  MapPin,
  Package,
  CalendarClock,
  Wallet,
  Trash2,
} from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

const date = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "short",
  timeStyle: "short",
});

const statusFa: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
};

const statusStyle: Record<string, string> = {
  PENDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PAID: "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400",
  PROCESSING:
    "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  SHIPPED:
    "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  DELIVERED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELED: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      User: { select: { phone: true, name: true } },
      Address: true,
      OrderItem: {
        include: {
          Product: { select: { title: true } },
          SimNumber: { select: { number: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
          <ShoppingBag className="size-6" />
        </div>

        <div>
          <h1 className="text-xl font-black text-ink sm:text-2xl">
            مدیریت سفارش‌ها
          </h1>

          <p className="mt-1 text-xs text-muted sm:text-sm">
            بررسی سفارش‌ها، اطلاعات مشتری و وضعیت ارسال
          </p>
        </div>
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-5 py-16 text-center shadow-sm">
          <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-surface text-muted">
            <ShoppingBag className="size-9" />
          </div>

          <h2 className="font-bold text-ink">هنوز سفارشی ثبت نشده است</h2>

          <p className="mt-2 text-sm text-muted">
            سفارش‌های ثبت‌شده در این قسمت نمایش داده خواهند شد.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article
              key={o.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
            >
              {/* Order Header */}
              <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
                    <UserRound className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">
                      {o.User.name ?? o.User.phone}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <CalendarClock className="size-3.5" />
                      <span>{date.format(o.createdAt)}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${
                      statusStyle[o.status] ??
                      "border-border bg-surface text-muted"
                    }`}
                  >
                    {statusFa[o.status] ?? o.status}
                  </span>
                </div>

                {/* Status Form */}
                {o.status !== "CANCELED" && (
                  <form
                    action={updateOrderStatus.bind(null, o.id)}
                    className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
                  >
                    <select
                      name="status"
                      defaultValue={o.status}
                      className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 lg:min-w-[170px]"
                    >
                      {Object.entries(statusFa).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      ذخیره وضعیت
                    </button>
                  </form>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Package className="size-4 text-brand" />
                  اقلام سفارش
                </div>

                <ul className="space-y-2">
                  {o.OrderItem.map((i) => (
                    <li
                      key={i.id}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-surface p-3"
                    >
                      <span className="min-w-0 flex-1 text-sm text-ink">
                        {i.Product?.title ?? `سیم‌کارت ${i.SimNumber?.number}`}
                      </span>

                      <span className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted">
                        × {fa(i.qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Address */}
                <div className="rounded-xl border border-border bg-surface p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                    <MapPin className="size-4 text-brand" />
                    آدرس تحویل
                  </div>

                  <p className="text-sm leading-7 text-muted">
                    {o.Address.province}، {o.Address.city}، {o.Address.street}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                    <div>
                      کد پستی:{" "}
                      <span className="font-medium text-ink" dir="ltr">
                        {o.Address.postalCode}
                      </span>
                    </div>

                    <div>
                      تلفن گیرنده:{" "}
                      <span className="font-medium text-ink" dir="ltr">
                        {o.Address.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Wallet className="size-4" />
                    مبلغ سفارش
                  </div>

                  <div className="text-base font-black text-ink sm:text-lg">
                    {fa(o.total)}
                    <span className="mr-1 text-xs font-medium text-muted">
                      تومان
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
