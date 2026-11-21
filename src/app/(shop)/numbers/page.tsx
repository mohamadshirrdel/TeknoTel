import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toEn } from "@/lib/digits";
import AddSimButton from "@/components/shop/AddSimButton";

export const metadata: Metadata = { title: "خرید سیم‌کارت 0912" };

const fa = (n: number) => n.toLocaleString("fa-IR");
const types = ["عادی", "رند", "طلایی"];

const badge: Record<string, string> = {
  عادی: "bg-gray-100 text-gray-600",
  رند: "bg-sky-100 text-sky-700",
  طلایی: "bg-amber-100 text-amber-700",
};

// 09121234567 -> 0912 123 4567
const format = (n: string) => `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;

type SP = { q?: string | string[]; type?: string | string[] };

export default async function NumbersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  // ورودی آدرس قابل اعتماد نیست: فقط رقم نگه می‌داریم
  const rawQ = typeof sp.q === "string" ? sp.q : "";
  const q = toEn(rawQ).replace(/\D/g, "").slice(0, 11);
  const type =
    typeof sp.type === "string" && types.includes(sp.type) ? sp.type : "";

  const sims = await prisma.simNumber.findMany({
    where: {
      sold: false,
      ...(q && { number: { contains: q } }),
      ...(type && { type }),
    },
    orderBy: { price: "asc" },
    take: 60,
  });

  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-brand text-white"
        : "bg-white text-ink shadow-sm hover:text-brand"
    }`;

  // لینک فیلتر نوع، با حفظ جستجوی فعلی
  const typeHref = (t: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (t) p.set("type", t);
    const s = p.toString();
    return s ? `/numbers?${s}` : "/numbers";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">سیم‌کارت 0912</h1>
        <p className="mt-1 text-sm text-gray-500">
          شماره‌ی دلخواه خود را جستجو و سفارش دهید.
        </p>
      </div>

      {/* فرم جستجو: بدون جاوااسکریپت، با آدرس کار می‌کند */}
      <form action="/numbers" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          dir="ltr"
          inputMode="numeric"
          maxLength={11}
          placeholder="بخشی از شماره، مثلاً 8888"
          className="w-full max-w-md rounded-xl bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/30"
        />
        {type && <input type="hidden" name="type" value={type} />}
        <button className="rounded-xl bg-brand px-6 text-sm font-bold text-white hover:bg-brand-dark">
          جستجو
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link href={typeHref("")} className={chip(type === "")}>
          همه
        </Link>
        {types.map((t) => (
          <Link key={t} href={typeHref(t)} className={chip(type === t)}>
            {t}
          </Link>
        ))}
      </div>

      {sims.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-gray-500">
          شماره‌ای با این مشخصات پیدا نشد.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sims.map((s) => (
            <div
              key={s.id}
              className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span dir="ltr" className="text-xl font-black tracking-wider">
                  {format(s.number)}
                </span>
                {s.type && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${badge[s.type] ?? badge["عادی"]}`}
                  >
                    {s.type}
                  </span>
                )}
              </div>
              <div className="font-bold">
                {fa(s.price)} <span className="text-xs font-normal">تومان</span>
              </div>
              <AddSimButton id={s.id} number={s.number} price={s.price} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
