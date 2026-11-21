import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toEn } from "@/lib/digits";
import ProductCard from "@/components/shop/ProductCard";

export const metadata: Metadata = { title: "جستجو" };

type SP = { q?: string | string[] };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  // ورودی آدرس دست کاربر است: رشته بودن را چک و طولش را محدود می‌کنیم
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 50);

  const products = q
    ? await prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { Category: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      })
    : [];

  // اگر عبارت فقط رقم بود، احتمالاً دنبال شماره‌ی سیم‌کارت است
  const digits = toEn(q).replace(/\D/g, "");
  const looksLikeNumber =
    digits.length >= 3 && digits.length === toEn(q).replace(/\s/g, "").length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-black">
        {q ? <>نتایج جستجو برای «{q}»</> : "جستجو"}
      </h1>

      {looksLikeNumber && (
        <Link
          href={`/numbers?q=${digits}`}
          className="block rounded-2xl bg-white p-4 text-sm shadow-sm hover:text-brand"
        >
          دنبال سیم‌کارت هستید؟ شماره‌های شامل «{digits}» را ببینید ←
        </Link>
      )}

      {!q ? (
        <p className="rounded-2xl bg-white p-8 text-center text-gray-500">
          عبارت مورد نظر را در کادر جستجو وارد کنید.
        </p>
      ) : products.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-gray-500">
          محصولی با این مشخصات پیدا نشد.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              title={p.title}
              image={p.images[0] ?? "/placeholder.png"}
              price={p.price}
              discount={p.discount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
