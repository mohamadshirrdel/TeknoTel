"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Home,
  Building2,
  MapPinned,
  Phone,
  Mail,
  ShoppingBag,
  Package,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import { useCart, getCartItemId } from "@/store/cart";
import { createOrder } from "@/actions/order";
import { toEn } from "@/lib/digits";
import { payOrder } from "@/actions/payment";

type Addr = {
  id: string;
  title: string;
  province: string;
  city: string;
  street: string;
};

const fa = (n: number) => n.toLocaleString("fa-IR");
const noop = () => () => {};

const emptyForm = {
  title: "",
  province: "",
  city: "",
  street: "",
  postalCode: "",
  phone: "",
};

export default function CheckoutForm({
  addresses,
}: {
  addresses: Addr[];
}) {
  const router = useRouter();
  const items = useCart((s) => s.items);

  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const [selected, setSelected] = useState<string>(
    addresses[0]?.id ?? "new",
  );

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white px-5 py-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5 grid size-20 place-items-center rounded-full bg-brand/10 text-brand">
          <ShoppingBag className="size-9" />
        </div>

        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          سبد خرید شما خالی است
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          برای ثبت سفارش ابتدا محصولی به سبد خرید اضافه کنید.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          بازگشت به فروشگاه
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const itemCount = items.reduce(
    (sum, item) => sum + item.qty,
    0,
  );

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const res = await createOrder({
        items: items.map((i) => ({
          id: i.id,
          kind: i.kind,
          qty: i.qty,
          variantId: i.variantId ?? null,
        })),

        ...(selected === "new"
          ? { address: form }
          : { addressId: selected }),
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      // شروع فرایند پرداخت
      // سبد خرید تا تأیید نهایی پرداخت حفظ می‌شود.
      const pay = await payOrder(res.orderId);

      if (!pay.ok) {
        setError(pay.error);
        router.push("/dashboard/orders");
        return;
      }

      window.location.href = pay.url;
    });
  }

  const updateField =
    (key: keyof typeof emptyForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((current) => ({
        ...current,
        [key]: e.target.value,
      }));
    };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand dark:focus:bg-gray-800";

  return (
    <form
      onSubmit={submit}
      className="grid items-start gap-6 lg:grid-cols-3"
    >
      {/* اطلاعات تحویل */}
      <div className="space-y-6 lg:col-span-2">
        {/* آدرس تحویل */}
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3 border-b border-gray-100 p-5 dark:border-gray-700">
            <div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <MapPin className="size-5" />
            </div>

            <div>
              <h2 className="font-black text-gray-900 dark:text-white">
                آدرس تحویل سفارش
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                محل دریافت سفارش خود را انتخاب کنید.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {/* آدرس‌های ذخیره‌شده */}
            {addresses.map((address) => {
              const active = selected === address.id;

              return (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    active
                      ? "border-brand bg-brand/5 ring-1 ring-brand/20 dark:bg-brand/10"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={active}
                    onChange={() => setSelected(address.id)}
                    className="mt-1 size-4 shrink-0 accent-brand"
                  />

                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      active
                        ? "bg-brand/10 text-brand"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <Home className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {address.title}
                      </span>

                      {active && (
                        <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-bold text-brand">
                          انتخاب شده
                        </span>
                      )}
                    </div>

                    <p className="mt-2 flex items-start gap-1.5 text-sm leading-7 text-gray-500 dark:text-gray-400">
                      <MapPinned className="mt-1 size-4 shrink-0" />
                      <span>
                        {address.province}، {address.city}،{" "}
                        {address.street}
                      </span>
                    </p>
                  </div>

                  {active && (
                    <CheckCircle2 className="size-5 shrink-0 text-brand" />
                  )}
                </label>
              );
            })}

            {/* افزودن آدرس جدید */}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4 transition ${
                selected === "new"
                  ? "border-brand bg-brand/5 dark:bg-brand/10"
                  : "border-gray-300 hover:border-brand dark:border-gray-700"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selected === "new"}
                onChange={() => setSelected("new")}
                className="size-4 accent-brand"
              />

              <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <Plus className="size-5" />
              </div>

              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  افزودن آدرس جدید
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ثبت یک آدرس جدید برای تحویل سفارش
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* فرم آدرس جدید */}
        {selected === "new" && (
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3 border-b border-gray-100 p-5 dark:border-gray-700">
              <div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <Building2 className="size-5" />
              </div>

              <div>
                <h2 className="font-black text-gray-900 dark:text-white">
                  اطلاعات آدرس جدید
                </h2>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  مشخصات محل تحویل سفارش را وارد کنید.
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {/* عنوان آدرس */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  عنوان آدرس
                </label>

                <input
                  required
                  className={inputClass}
                  placeholder="مثلاً منزل، محل کار"
                  value={form.title}
                  onChange={updateField("title")}
                />
              </div>

              {/* استان */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  استان
                </label>

                <input
                  required
                  className={inputClass}
                  placeholder="نام استان"
                  value={form.province}
                  onChange={updateField("province")}
                />
              </div>

              {/* شهر */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  شهر
                </label>

                <input
                  required
                  className={inputClass}
                  placeholder="نام شهر"
                  value={form.city}
                  onChange={updateField("city")}
                />
              </div>

              {/* کد پستی */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  کد پستی
                </label>

                <input
                  required
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass}
                  placeholder="۱۰ رقم"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      postalCode: toEn(e.target.value).replace(
                        /\D/g,
                        "",
                      ),
                    }))
                  }
                />
              </div>

              {/* شماره موبایل */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  شماره موبایل گیرنده
                </label>

                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

                  <input
                    required
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={11}
                    className={`${inputClass} pr-11 text-left`}
                    placeholder="09123456789"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        phone: toEn(e.target.value).replace(
                          /\D/g,
                          "",
                        ),
                      }))
                    }
                  />
                </div>
              </div>

              {/* آدرس کامل */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  آدرس کامل
                </label>

                <textarea
                  required
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="خیابان، کوچه، پلاک، واحد و سایر جزئیات..."
                  value={form.street}
                  onChange={updateField("street")}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* خلاصه سفارش */}
      <aside className="h-fit space-y-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:sticky lg:top-32">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-brand" />

            <h2 className="font-black text-gray-900 dark:text-white">
              خلاصه سفارش
            </h2>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {fa(itemCount)} کالا
          </span>
        </div>

        {/* محصولات */}
        <div className="max-h-[350px] space-y-4 overflow-y-auto">
          {items.map((item) => {
            const cartItemId =
              item.cartItemId || getCartItemId(item);

            return (
              <div
                key={cartItemId}
                className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-700"
              >
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <Package className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-200">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      تعداد: {fa(item.qty)}
                    </p>
                  </div>
                </div>

                {item.selectedOptions &&
                  item.selectedOptions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.selectedOptions.map(
                        (option, index) => (
                          <span
                            key={`${option.name}-${index}`}
                            className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          >
                            {option.name}: {option.value}
                          </span>
                        ),
                      )}
                    </div>
                  )}

                <p className="mt-3 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                  {fa(item.price * item.qty)} تومان
                </p>
              </div>
            );
          })}
        </div>

        {/* مبلغ نهایی */}
        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>تعداد اقلام</span>
            <span>{fa(itemCount)} عدد</span>
          </div>

          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>جمع سفارش</span>
            <span>{fa(total)} تومان</span>
          </div>

          <div className="rounded-2xl bg-brand/5 p-4 dark:bg-brand/10">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              مبلغ قابل پرداخت
            </p>

            <div className="mt-2 flex flex-wrap items-baseline gap-1">
              <span className="text-xl font-black text-brand">
                {fa(total)}
              </span>

              <span className="text-xs text-gray-500 dark:text-gray-400">
                تومان
              </span>
            </div>
          </div>
        </div>

        {/* خطا */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />

            <p className="leading-6">{error}</p>
          </div>
        )}

        {/* دکمه ثبت سفارش */}
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {pending ? (
            <>
              <LoaderCircle className="size-5 animate-spin" />
              در حال ثبت سفارش...
            </>
          ) : (
            <>
              <CreditCard className="size-5" />
              ثبت سفارش و پرداخت
            </>
          )}
        </button>

        {/* توضیحات امنیت */}
        <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-500" />

          <p className="text-xs leading-6 text-gray-500 dark:text-gray-400">
            پرداخت شما از طریق درگاه پرداخت انجام می‌شود.
          </p>
        </div>

        <Link
          href="/cart"
          className="block text-center text-sm font-medium text-gray-500 transition hover:text-brand dark:text-gray-400"
        >
          بازگشت به سبد خرید
        </Link>
      </aside>
    </form>
  );
}