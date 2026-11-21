"use client";

import { useState, useTransition } from "react";
import { linkPhone } from "@/actions/profile";
import { toEn } from "@/lib/digits";

export default function PhoneLinkForm() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const input =
    "w-full rounded-xl bg-surface px-4 py-3 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-brand/30";
  const btn =
    "w-full rounded-xl bg-brand py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-50";

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data.error ?? "خطا در ارسال کد");
      }
      setStep("code");
    });
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await linkPhone(phone, code);
      if (!res.ok) return setError(res.error);
      // بارگذاری کامل تا session تازه خوانده شود
      window.location.href = "/";
    });
  }

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
          <button disabled={pending} className={btn}>
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
          <button disabled={pending} className={btn}>
            تایید و ادامه
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
            }}
            className="w-full text-sm text-gray-500"
          >
            ویرایش شماره
          </button>
        </form>
      )}

      {error && <p className="text-center text-sm text-brand">{error}</p>}
    </div>
  );
}
