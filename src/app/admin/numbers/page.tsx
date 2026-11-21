import { prisma } from "@/lib/prisma";
import { deleteSim } from "@/actions/admin";
import SimForm from "@/components/admin/SimForm";
import { Smartphone, Trash2, CheckCircle2, ShoppingBag } from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

export default async function AdminNumbers() {
  const sims = await prisma.simNumber.findMany({
    orderBy: [{ sold: "asc" }, { price: "asc" }],
    include: { _count: { select: { OrderItem: true } } },
  });

  const soldCount = sims.filter((s) => s.sold).length;
  const availableCount = sims.length - soldCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink sm:text-3xl">
            مدیریت سیم‌کارت‌ها
          </h1>
          <p className="mt-1 text-sm text-muted">
            مدیریت شماره‌ها، قیمت‌ها و وضعیت فروش
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted">
          <Smartphone className="size-4 text-brand" />
          <span>{fa(sims.length)} شماره</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Smartphone className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted">کل شماره‌ها</p>
              <p className="mt-1 text-xl font-black text-ink">
                {fa(sims.length)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted">شماره‌های موجود</p>
              <p className="mt-1 text-xl font-black text-ink">
                {fa(availableCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <ShoppingBag className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted">فروخته‌شده</p>
              <p className="mt-1 text-xl font-black text-ink">
                {fa(soldCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add SIM */}
      <SimForm />

      {/* SIM List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-1 border-b border-border p-4 sm:p-5">
          <h2 className="font-bold text-ink">لیست شماره‌ها</h2>
          <p className="text-xs text-muted">
            مدیریت و مشاهده وضعیت شماره‌های ثبت‌شده
          </p>
        </div>

        {sims.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Smartphone className="size-7" />
            </div>

            <p className="font-bold text-ink">هنوز شماره‌ای ثبت نشده است</p>
            <p className="text-sm text-muted">
              از فرم بالا برای افزودن شماره جدید استفاده کنید.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-surface text-muted">
                  <tr>
                    <th className="whitespace-nowrap p-4 font-medium">شماره</th>
                    <th className="whitespace-nowrap p-4 font-medium">نوع</th>
                    <th className="whitespace-nowrap p-4 font-medium">قیمت</th>
                    <th className="whitespace-nowrap p-4 font-medium">وضعیت</th>
                    <th className="whitespace-nowrap p-4 font-medium">
                      عملیات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sims.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-border transition hover:bg-surface/50"
                    >
                      <td className="p-4 font-medium text-ink" dir="ltr">
                        {s.number}
                      </td>

                      <td className="p-4 text-muted">{s.type ?? "—"}</td>

                      <td className="whitespace-nowrap p-4 font-semibold text-ink">
                        {fa(s.price)}{" "}
                        <span className="text-xs font-normal text-muted">
                          تومان
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            s.sold
                              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {s.sold ? "فروخته‌شده" : "موجود"}
                        </span>
                      </td>

                      <td className="p-4">
                        {s._count.OrderItem > 0 ? (
                          <span className="text-xs text-muted">
                            دارای سفارش
                          </span>
                        ) : (
                          <form action={deleteSim.bind(null, s.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-red-500 transition hover:bg-red-500/10"
                            >
                              <Trash2 className="size-3.5" />
                              حذف
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-border md:hidden">
              {sims.map((s) => (
                <div key={s.id} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      dir="ltr"
                      className="text-base font-bold tracking-wide text-ink"
                    >
                      {s.number}
                    </span>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.sold
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                          : "bg-green-500/10 text-green-600 dark:text-green-400"
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {s.sold ? "فروخته‌شده" : "موجود"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted">نوع شماره</p>
                      <p className="text-sm text-ink">{s.type ?? "—"}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted">قیمت</p>
                      <p className="text-sm font-bold text-ink">
                        {fa(s.price)} تومان
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-border pt-2">
                    {s._count.OrderItem > 0 ? (
                      <span className="text-xs text-muted">دارای سفارش</span>
                    ) : (
                      <form action={deleteSim.bind(null, s.id)}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-red-500 transition hover:bg-red-500/10"
                        >
                          <Trash2 className="size-3.5" />
                          حذف شماره
                        </button>
                      </form>
                    )}
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
