import { prisma } from "@/lib/prisma";
import { Users, ShieldCheck, ShoppingBag } from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

const date = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "short",
});

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { Order: true } } },
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const orderCount = users.reduce((sum, u) => sum + u._count.Order, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink sm:text-3xl">
            مدیریت کاربران
          </h1>
          <p className="mt-1 text-sm text-muted">
            مشاهده اطلاعات کاربران و فعالیت آن‌ها در فروشگاه
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted">
          <Users className="size-4 text-brand" />
          {fa(users.length)} کاربر
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {/* Total users */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Users className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted">کاربران</p>
              <p className="mt-1 text-xl font-black text-ink">
                {fa(users.length)}
              </p>
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted">مدیران</p>
              <p className="mt-1 text-xl font-black text-ink">
                {fa(adminCount)}
              </p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
              <ShoppingBag className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted">مجموع سفارش کاربران</p>
              <p className="mt-1 text-xl font-black text-ink">
                {fa(orderCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 sm:p-5">
          <h2 className="font-bold text-ink">لیست کاربران</h2>
          <p className="mt-1 text-xs text-muted">
            آخرین کاربران ثبت‌نام‌شده در فروشگاه
          </p>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Users className="size-7" />
            </div>

            <p className="font-bold text-ink">هنوز کاربری ثبت نشده است</p>
            <p className="text-sm text-muted">
              کاربران ثبت‌نام‌شده در این قسمت نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-surface text-muted">
                  <tr>
                    <th className="whitespace-nowrap p-4 font-medium">
                      موبایل / ایمیل
                    </th>
                    <th className="whitespace-nowrap p-4 font-medium">نقش</th>
                    <th className="whitespace-nowrap p-4 font-medium">
                      سفارش‌ها
                    </th>
                    <th className="whitespace-nowrap p-4 font-medium">
                      تاریخ عضویت
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-border transition hover:bg-surface/50"
                    >
                      <td className="p-4 font-medium text-ink" dir="ltr">
                        {u.phone ?? u.email ?? "—"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-brand/10 text-brand"
                          }`}
                        >
                          {u.role === "ADMIN" ? (
                            <>
                              <ShieldCheck className="size-3.5" />
                              مدیر
                            </>
                          ) : (
                            "کاربر"
                          )}
                        </span>
                      </td>

                      <td className="p-4 font-medium text-ink">
                        {fa(u._count.Order)}
                      </td>

                      <td className="p-4 text-muted">
                        {date.format(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-border md:hidden">
              {users.map((u) => (
                <div key={u.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="break-all text-sm font-semibold text-ink"
                      dir="ltr"
                    >
                      {u.phone ?? u.email ?? "—"}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-brand/10 text-brand"
                      }`}
                    >
                      {u.role === "ADMIN" && (
                        <ShieldCheck className="size-3.5" />
                      )}
                      {u.role === "ADMIN" ? "مدیر" : "کاربر"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">تعداد سفارش‌ها</p>
                      <p className="mt-1 text-sm font-bold text-ink">
                        {fa(u._count.Order)}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-muted">تاریخ عضویت</p>
                      <p className="mt-1 text-sm text-ink">
                        {date.format(u.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
