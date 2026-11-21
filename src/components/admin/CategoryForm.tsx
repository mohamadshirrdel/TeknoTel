"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { createCategory } from "@/actions/admin";
import type { FormState } from "@/actions/product";
import { FolderPlus, CheckCircle2, AlertCircle } from "lucide-react";

type CategoryOption = {
  id: string;
  name: string;
  parentId: string | null;
};

type Props = {
  categories: CategoryOption[];
};

const initial: FormState = { ok: false };

export default function CategoryForm({ categories }: Props) {
  const [state, action, pending] = useActionState(createCategory, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  const options = useMemo(() => {
    const result: { id: string; label: string }[] = [];

    const addChildren = (parentId: string | null, depth: number) => {
      const children = categories
        .filter((category) => category.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name, "fa"));

      for (const category of children) {
        result.push({
          id: category.id,
          label: `${"— ".repeat(depth)}${category.name}`,
        });

        addChildren(category.id, depth + 1);
      }
    };

    addChildren(null, 0);

    return result;
  }, [categories]);

  const field =
    "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
          <FolderPlus className="size-5" />
        </div>

        <div className="min-w-0">
          <h2 className="font-bold text-ink">افزودن دسته‌بندی</h2>

          <p className="mt-1 text-xs text-muted">
            یک دسته اصلی یا زیر‌دسته جدید ایجاد کنید.
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Category Name */}
        <div className="min-w-0 space-y-2">
          <label
            htmlFor="category-name"
            className="text-sm font-medium text-ink"
          >
            نام دسته‌بندی
          </label>

          <input
            id="category-name"
            name="name"
            placeholder="مثلاً گوشی موبایل"
            className={field}
            required
            minLength={2}
            disabled={pending}
          />
        </div>

        {/* Slug */}
        <div className="min-w-0 space-y-2">
          <label
            htmlFor="category-slug"
            className="text-sm font-medium text-ink"
          >
            اسلاگ (Slug)
          </label>

          <input
            id="category-slug"
            name="slug"
            dir="ltr"
            placeholder="mobile-phones"
            className={`${field} text-left`}
            required
            disabled={pending}
          />

          <p className="text-xs text-muted">
            فقط حروف انگلیسی کوچک، عدد و خط تیره
          </p>
        </div>

        {/* Parent Category */}
        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="category-parent"
            className="text-sm font-medium text-ink"
          >
            دسته والد
          </label>

          <select
            id="category-parent"
            name="parentId"
            defaultValue=""
            className={field}
            disabled={pending}
          >
            <option value="">بدون والد (دسته اصلی)</option>

            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>

          <p className="text-xs leading-6 text-muted">
            اگر دسته اصلی ایجاد می‌کنید، گزینه بدون والد را انتخاب کنید. برای
            ساخت زیر‌دسته، دسته والد موردنظر را انتخاب کنید.
          </p>
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
              <FolderPlus className="size-4" />
              ذخیره دسته‌بندی
            </>
          )}
        </button>

        {/* Error */}
        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-500"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Success */}
        {state.ok && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-sm font-medium text-green-600 dark:text-green-400"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            دسته‌بندی با موفقیت اضافه شد.
          </div>
        )}
      </div>
    </form>
  );
}
