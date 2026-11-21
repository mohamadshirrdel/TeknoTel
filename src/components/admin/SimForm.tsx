"use client";

import { useActionState, useEffect, useRef } from "react";
import { createSim } from "@/actions/admin";
import type { FormState } from "@/actions/product";
import { Smartphone, Plus, CheckCircle2, AlertCircle } from "lucide-react";

const initial: FormState = { ok: false };

export default function SimForm() {
  const [state, action, pending] = useActionState(createSim, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  const field =
    "w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
          <Smartphone className="size-5" />
        </div>

        <div>
          <h2 className="font-bold text-ink">افزودن سیم‌کارت</h2>
          <p className="mt-1 text-xs text-muted">
            شماره، قیمت و نوع شماره سیم‌کارت را وارد کنید.
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Phone Number */}
        <div className="min-w-0 space-y-2">
          <label htmlFor="sim-number" className="text-sm font-medium text-ink">
            شماره سیم‌کارت
          </label>

          <input
            id="sim-number"
            name="number"
            dir="ltr"
            inputMode="numeric"
            maxLength={11}
            pattern="09[0-9]{9}"
            placeholder="09121234567"
            className={field}
            required
            disabled={pending}
          />
        </div>

        {/* Price */}
        <div className="min-w-0 space-y-2">
          <label htmlFor="sim-price" className="text-sm font-medium text-ink">
            قیمت (تومان)
          </label>

          <input
            id="sim-price"
            name="price"
            dir="ltr"
            inputMode="numeric"
            placeholder="مثلاً 5000000"
            className={field}
            required
            disabled={pending}
          />
        </div>

        {/* Type */}
        <div className="min-w-0 space-y-2 sm:col-span-2 lg:col-span-1">
          <label htmlFor="sim-type" className="text-sm font-medium text-ink">
            نوع شماره
          </label>

          <select
            id="sim-type"
            name="type"
            className={field}
            required
            defaultValue=""
            disabled={pending}
          >
            <option value="" disabled>
              انتخاب نوع شماره
            </option>
            <option value="عادی">عادی</option>
            <option value="رند">رند</option>
            <option value="طلایی">طلایی</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {pending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Plus className="size-4" />
              ذخیره سیم‌کارت
            </>
          )}
        </button>

        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-500"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {state.ok && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-sm font-medium text-green-600 dark:text-green-400"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            سیم‌کارت با موفقیت اضافه شد.
          </div>
        )}
      </div>
    </form>
  );
}
