"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// تبدیل ارقام فارسی/عربی به انگلیسی
const toEn = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error ?? "خطا در ارسال کد");
    }
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("phone-otp", { phone, code, redirect: false });
    setLoading(false);
    if (res?.error) return setError("کد اشتباه یا منقضی شده است");
    router.push("/");
    router.refresh();
  }

  const input =
    "w-full rounded-xl bg-surface px-4 py-3 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-brand/30";
  const btn =
    "w-full rounded-xl bg-brand py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-50";

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <input
            dir="ltr"
            inputMode="numeric"
            maxLength={11}
            placeholder="09123456789"
            value={phone}
            onChange={(e) => setPhone(toEn(e.target.value))}
            className={input}
          />
          <button disabled={loading} className={btn}>
            دریافت کد تایید
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-center text-sm text-gray-500">
            کد ارسال‌شده به {phone} را وارد کنید
          </p>
          <input
            dir="ltr"
            inputMode="numeric"
            maxLength={5}
            placeholder="•••••"
            value={code}
            onChange={(e) => setCode(toEn(e.target.value))}
            className={input}
          />
          <button disabled={loading} className={btn}>
            ورود
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
            }}
            className="w-full text-sm text-gray-500"
          >
            ویرایش شماره
          </button>
        </form>
      )}

      {error && <p className="text-center text-sm text-brand">{error}</p>}

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> یا{" "}
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full rounded-xl border py-3 text-sm font-medium hover:bg-surface"
      >
        ورود با گوگل
      </button>
    </div>
  );
}
