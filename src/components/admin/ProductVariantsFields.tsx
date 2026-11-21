"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, RefreshCw, Layers3 } from "lucide-react";

type OptionDraft = {
  id: number;
  name: string;
  values: string;
};

type Selection = {
  optionName: string;
  value: string;
};

type VariantDraft = {
  combinationKey: string;
  selections: Selection[];
  price: string;
  discount: string;
  stock: string;
  isActive: boolean;
};

type InitialOption = {
  name: string;
  values: string[];
};

type InitialVariant = {
  selections: Selection[];
  price: number;
  discount: number;
  stock: number;
  isActive: boolean;
};

type Props = {
  initialOptions?: InitialOption[];
  initialVariants?: InitialVariant[];
};

const fa = (n: number) => n.toLocaleString("fa-IR");

const field =
  "w-full min-w-0 rounded-xl border border-border bg-card px-3 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";

function createCombinations(options: OptionDraft[]): Selection[][] {
  const prepared = options
    .map((option) => ({
      name: option.name.trim(),
      values: option.values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    }))
    .filter((option) => option.name && option.values.length > 0);

  if (prepared.length === 0) return [];

  return prepared.reduce<Selection[][]>(
    (combinations, option) =>
      combinations.flatMap((combination) =>
        option.values.map((value) => [
          ...combination,
          {
            optionName: option.name,
            value,
          },
        ]),
      ),
    [[]],
  );
}

function createCombinationKey(selections: Selection[]) {
  return JSON.stringify(
    selections.map((item) => [item.optionName, item.value]),
  );
}

export default function ProductVariantsFields({
  initialOptions = [],
  initialVariants = [],
}: Props) {
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  const sectionRef = useRef<HTMLElement>(null);
  const nextIdRef = useRef(1);

  // بارگذاری اطلاعات اولیه در حالت ویرایش
  useEffect(() => {
    const loadedOptions = initialOptions.map((option) => ({
      id: nextIdRef.current++,
      name: option.name,
      values: option.values.join(", "),
    }));

    const loadedVariants: VariantDraft[] = initialVariants.map((variant) => ({
      combinationKey: createCombinationKey(variant.selections),
      selections: variant.selections,
      price: String(variant.price),
      discount: String(variant.discount),
      stock: String(variant.stock),
      isActive: variant.isActive,
    }));

    setOptions(loadedOptions);
    setVariants(loadedVariants);
  }, [initialOptions, initialVariants]);

  // ریست فرم
  useEffect(() => {
    const form = sectionRef.current?.closest("form");

    if (!form) return;

    const handleReset = () => {
      setOptions([]);
      setVariants([]);
      nextIdRef.current = 1;
    };

    form.addEventListener("reset", handleReset);

    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, []);

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        id: nextIdRef.current++,
        name: "",
        values: "",
      },
    ]);
  };

  const removeOption = (id: number) => {
    setOptions((prev) => prev.filter((item) => item.id !== id));
  };

  const updateOption = (id: number, key: "name" | "values", value: string) => {
    setOptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  // ساخت ترکیب‌ها و حفظ اطلاعات قبلی ترکیب‌های مشترک
  const generateVariants = () => {
    const combinations = createCombinations(options);

    const generated: VariantDraft[] = combinations.map((selections) => {
      const combinationKey = createCombinationKey(selections);

      const existing = variants.find(
        (variant) => variant.combinationKey === combinationKey,
      );

      return (
        existing ?? {
          combinationKey,
          selections,
          price: "",
          discount: "0",
          stock: "0",
          isActive: true,
        }
      );
    });

    setVariants(generated);
  };

  const updateVariant = (
    combinationKey: string,
    key: "price" | "discount" | "stock",
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.combinationKey === combinationKey
          ? { ...variant, [key]: value }
          : variant,
      ),
    );
  };

  const updateActive = (combinationKey: string, isActive: boolean) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.combinationKey === combinationKey
          ? { ...variant, isActive }
          : variant,
      ),
    );
  };

  const variantsData = {
    options: options
      .map((option) => ({
        name: option.name.trim(),
        values: option.values
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      }))
      .filter((option) => option.name && option.values.length > 0),

    variants: variants.map((variant) => ({
      ...variant,
      price: Number(variant.price),
      discount: Number(variant.discount),
      stock: Number(variant.stock),
    })),
  };

  return (
    <section
      ref={sectionRef}
      className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      {/* عنوان بخش */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Layers3 className="size-5" />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-ink">تنوع محصولات</h3>

          <p className="mt-1 text-xs leading-6 text-muted">
            برای محصولاتی مثل موبایل، رنگ، حافظه و رم را تعریف کنید و برای هر
            ترکیب قیمت و موجودی جداگانه قرار دهید.
          </p>
        </div>
      </div>

      {/* ویژگی‌ها */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <div
            key={option.id}
            className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2"
          >
            <div className="min-w-0 space-y-2">
              <label className="block text-xs font-medium text-muted">
                نام ویژگی {fa(index + 1)}
              </label>

              <input
                className={field}
                placeholder="مثلاً رنگ"
                value={option.name}
                onChange={(e) =>
                  updateOption(option.id, "name", e.target.value)
                }
              />
            </div>

            <div className="min-w-0 space-y-2">
              <label className="block text-xs font-medium text-muted">
                مقادیر (با کاما جدا کنید)
              </label>

              <div className="flex min-w-0 gap-2">
                <input
                  className={field}
                  placeholder="مشکی، سفید، آبی"
                  value={option.values}
                  onChange={(e) =>
                    updateOption(option.id, "values", e.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 text-red-500 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                  aria-label="حذف ویژگی"
                  title="حذف ویژگی"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* افزودن ویژگی */}
      <button
        type="button"
        onClick={addOption}
        className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Plus className="size-4" />
        افزودن ویژگی
      </button>

      {/* ساخت ترکیب‌ها */}
      {options.length > 0 && (
        <button
          type="button"
          onClick={generateVariants}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <RefreshCw className="size-4" />
          ساخت ترکیب‌های محصول
        </button>
      )}

      {/* ترکیب‌ها */}
      {variants.length > 0 && (
        <div className="space-y-4 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-ink">ترکیب‌های ساخته‌شده</h4>

            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              {fa(variants.length)} ترکیب
            </span>
          </div>

          {variants.map((variant, index) => (
            <div
              key={variant.combinationKey}
              className="space-y-4 rounded-xl border border-border bg-surface p-3 sm:p-4"
            >
              {/* عنوان و وضعیت */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold text-ink">
                  ترکیب {fa(index + 1)}
                </span>

                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={variant.isActive}
                    onChange={(e) =>
                      updateActive(variant.combinationKey, e.target.checked)
                    }
                    className="size-4 accent-brand"
                  />
                  فعال
                </label>
              </div>

              {/* مشخصات ترکیب */}
              <div className="flex flex-wrap gap-2">
                {variant.selections.map((selection) => (
                  <span
                    key={`${selection.optionName}-${selection.value}`}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink"
                  >
                    <span className="text-muted">{selection.optionName}:</span>{" "}
                    {selection.value}
                  </span>
                ))}
              </div>

              {/* قیمت و موجودی */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0 space-y-2">
                  <label className="block text-xs font-medium text-muted">
                    قیمت (تومان)
                  </label>

                  <input
                    dir="ltr"
                    inputMode="numeric"
                    className={field}
                    placeholder="مثلاً 25000000"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(
                        variant.combinationKey,
                        "price",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <label className="block text-xs font-medium text-muted">
                    تخفیف درصدی
                  </label>

                  <input
                    dir="ltr"
                    inputMode="numeric"
                    className={field}
                    value={variant.discount}
                    onChange={(e) =>
                      updateVariant(
                        variant.combinationKey,
                        "discount",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <label className="block text-xs font-medium text-muted">
                    موجودی
                  </label>

                  <input
                    dir="ltr"
                    inputMode="numeric"
                    className={field}
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(
                        variant.combinationKey,
                        "stock",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* اطلاعات ارسالی به سرور */}
      <input
        type="hidden"
        name="variantsData"
        value={JSON.stringify(variantsData)}
      />
    </section>
  );
}
