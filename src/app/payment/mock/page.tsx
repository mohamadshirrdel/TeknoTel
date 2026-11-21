import { notFound } from "next/navigation";

export default async function MockGateway({
  searchParams,
}: {
  searchParams: Promise<{ authority?: string }>;
}) {
  // در محیط واقعی این صفحه اصلاً وجود ندارد
  if (process.env.NODE_ENV === "production") notFound();

  const { authority = "" } = await searchParams;
  if (!authority.startsWith("MOCK-")) notFound();

  const q = (s: string) =>
    `/api/payment/verify?Authority=${authority}&Status=${s}`;

  return (
    <main className="grid min-h-screen place-items-center bg-surface p-4">
      <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-black">درگاه آزمایشی</h1>
        <p className="text-sm text-gray-500">
          این صفحه فقط برای تست است و پول واقعی دریافت نمی‌کند.
        </p>
        <a
          href={q("OK")}
          className="block rounded-xl bg-green-600 py-3 font-bold text-white"
        >
          پرداخت موفق
        </a>
        <a
          href={q("NOK")}
          className="block rounded-xl bg-gray-200 py-3 font-bold"
        >
          انصراف / پرداخت ناموفق
        </a>
      </div>
    </main>
  );
}
