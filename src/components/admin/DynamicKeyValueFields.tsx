"use client";

import { Plus, Trash2 } from "lucide-react";

type Pair = {
  key: string;
  value: string;
};

type Props = {
  title: string;
  items: Pair[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: "key" | "value", value: string) => void;
};

export default function DynamicKeyValueFields({
  title,
  items,
  onAdd,
  onRemove,
  onChange,
}: Props) {
  const field =
    "min-w-0 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <p className="mt-1 text-xs text-muted">
            کلید و مقدار مشخصات را وارد کنید.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2 text-xs font-bold text-brand transition hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Plus className="size-4" />
          افزودن مورد
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface/50 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label
                    htmlFor={`key-${title}-${index}`}
                    className="text-xs font-medium text-muted"
                  >
                    کلید
                  </label>

                  <input
                    id={`key-${title}-${index}`}
                    type="text"
                    value={item.key}
                    onChange={(e) => onChange(index, "key", e.target.value)}
                    placeholder="مثلاً رم"
                    className={field}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label
                    htmlFor={`value-${title}-${index}`}
                    className="text-xs font-medium text-muted"
                  >
                    مقدار
                  </label>

                  <input
                    id={`value-${title}-${index}`}
                    type="text"
                    value={item.value}
                    onChange={(e) => onChange(index, "value", e.target.value)}
                    placeholder="مثلاً ۸ گیگابایت"
                    className={field}
                  />
                </div>
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`حذف مورد ${index + 1}`}
                  title="حذف"
                  className="mt-6 flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 text-red-500 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
