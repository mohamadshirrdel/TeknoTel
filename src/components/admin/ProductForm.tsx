"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  createProduct,
  updateProduct,
  type FormState,
} from "@/actions/product";

import ImageUploader from "@/components/admin/ImageUploader";
import DynamicKeyValueFields from "./DynamicKeyValueFields";
import ProductVariantsFields from "./ProductVariantsFields";
import { COLORS } from "@/lib/product-options";

type Cat = {
  id: string;
  name: string;
  parentId: string | null;
};

type Pair = {
  key: string;
  value: string;
};

type InitialOption = {
  name: string;
  values: string[];
};

type InitialVariant = {
  selections: {
    optionName: string;
    value: string;
  }[];
  price: number;
  discount: number;
  stock: number;
  isActive: boolean;
};

export type InitialProduct = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  discount: number;
  stock: number;
  brand: string | null;
  categoryId: string;
  images: string[];
  colors: string[];
  filterValues: Record<string, string>;
  customFields: Record<string, string>;
  options: InitialOption[];
  variants: InitialVariant[];
};

type Props = {
  categories: Cat[];
  initialProduct?: InitialProduct;
};

const initial: FormState = { ok: false };

const emptyPair: Pair = {
  key: "",
  value: "",
};

function jsonToPairs(value: Record<string, string> | null | undefined): Pair[] {
  if (!value) return [{ ...emptyPair }];

  const entries = Object.entries(value);

  if (!entries.length) return [{ ...emptyPair }];

  return entries.map(([key, value]) => ({
    key,
    value: String(value ?? ""),
  }));
}

export default function ProductForm({ categories, initialProduct }: Props) {
  const isEdit = Boolean(initialProduct);

  const productId = initialProduct?.id;

  const formAction = useMemo(() => {
    if (isEdit && productId) {
      return updateProduct.bind(null, productId);
    }

    return createProduct;
  }, [isEdit, productId]);

  const [state, action, pending] = useActionState(formAction, initial);

  const formRef = useRef<HTMLFormElement>(null);

  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);

  const [uploading, setUploading] = useState(false);

  const [filterValues, setFilterValues] = useState<Pair[]>(() =>
    jsonToPairs(initialProduct?.filterValues),
  );

  const [customFields, setCustomFields] = useState<Pair[]>(() =>
    jsonToPairs(initialProduct?.customFields),
  );

  useEffect(() => {
    if (!state.ok || isEdit) return;

    formRef.current?.reset();

    setImages([]);
    setFilterValues([{ ...emptyPair }]);
    setCustomFields([{ ...emptyPair }]);
  }, [state, isEdit]);

  // ساخت فهرست سلسله‌مراتبی دسته‌بندی‌ها
  const categoryOptions = useMemo(() => {
    const result: { id: string; name: string; depth: number }[] = [];

    const addChildren = (parentId: string | null, depth: number) => {
      const children = categories
        .filter((category) => category.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name, "fa"));

      for (const category of children) {
        result.push({
          id: category.id,
          name: category.name,
          depth,
        });

        addChildren(category.id, depth + 1);
      }
    };

    addChildren(null, 0);

    return result;
  }, [categories]);

  const addPair = (field: "filterValues" | "customFields") => {
    const setter = field === "filterValues" ? setFilterValues : setCustomFields;

    setter((prev) => [...prev, { ...emptyPair }]);
  };

  const removePair = (
    field: "filterValues" | "customFields",
    index: number,
  ) => {
    const setter = field === "filterValues" ? setFilterValues : setCustomFields;

    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePair = (
    field: "filterValues" | "customFields",
    index: number,
    key: "key" | "value",
    value: string,
  ) => {
    const setter = field === "filterValues" ? setFilterValues : setCustomFields;

    setter((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const field =
    "w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";
  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-7 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
    >
      {/* عنوان فرم */}
      <div className="border-b border-border pb-4">
        <h2 className="font-bold text-ink">
          {isEdit ? "ویرایش محصول" : "افزودن محصول"}
        </h2>

        <p className="mt-1 text-xs text-muted">
          اطلاعات محصول را در بخش‌های زیر وارد کنید.
        </p>
      </div>

      {/* اطلاعات اصلی */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-ink">اطلاعات اصلی محصول</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            placeholder="عنوان محصول"
            defaultValue={initialProduct?.title ?? ""}
            className={`${field} sm:col-span-2`}
            required
          />

          <input
            name="slug"
            dir="ltr"
            placeholder="slug (مثلاً samsung-a55)"
            defaultValue={initialProduct?.slug ?? ""}
            className={field}
            required
          />

          <select
            name="categoryId"
            className={field}
            required
            defaultValue={initialProduct?.categoryId ?? ""}
          >
            <option value="" disabled>
              دسته‌بندی محصول را انتخاب کنید
            </option>

            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {"　".repeat(category.depth)}
                {category.depth > 0 ? "└ " : ""}
                {category.name}
              </option>
            ))}
          </select>

          <input
            name="price"
            dir="ltr"
            inputMode="numeric"
            placeholder="قیمت (تومان)"
            defaultValue={initialProduct?.price ?? ""}
            className={field}
            required
          />

          <input
            name="discount"
            dir="ltr"
            inputMode="numeric"
            placeholder="تخفیف ٪ (اختیاری)"
            defaultValue={initialProduct?.discount ?? 0}
            className={field}
          />

          <input
            name="stock"
            dir="ltr"
            inputMode="numeric"
            placeholder="موجودی"
            defaultValue={initialProduct?.stock ?? ""}
            className={field}
            required
          />

          <input
            name="brand"
            placeholder="برند (اختیاری)"
            defaultValue={initialProduct?.brand ?? ""}
            className={field}
          />

          <textarea
            name="description"
            rows={4}
            placeholder="توضیحات محصول (اختیاری)"
            defaultValue={initialProduct?.description ?? ""}
            className={`${field} resize-y sm:col-span-2`}
          />
        </div>
      </section>

      {/* رنگ‌ها */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">رنگ‌های موجود</h3>

        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c.key} className="cursor-pointer">
              <input
                type="checkbox"
                name="colors"
                value={c.key}
                defaultChecked={initialProduct?.colors.includes(c.key) ?? false}
                className="peer sr-only"
              />

              <span className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink transition hover:border-brand/50 peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                <span
                  className="size-4 shrink-0 rounded-full border border-border"
                  style={{ background: c.hex }}
                />

                {c.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* تنوع محصولات */}
      <section className="space-y-3">
        <ProductVariantsFields
          initialOptions={initialProduct?.options ?? []}
          initialVariants={initialProduct?.variants ?? []}
        />
      </section>

      {/* ویژگی‌های فیلتری */}
      <section className="space-y-3">
        <DynamicKeyValueFields
          title="مشخصات محصول"
          items={filterValues}
          onAdd={() => addPair("filterValues")}
          onRemove={(index) => removePair("filterValues", index)}
          onChange={(index, key, value) =>
            updatePair("filterValues", index, key, value)
          }
        />
      </section>

      {/* ویژگی‌های سفارشی */}
      <section className="space-y-3">
        <DynamicKeyValueFields
          title="ویژگی‌های سفارشی"
          items={customFields}
          onAdd={() => addPair("customFields")}
          onRemove={(index) => removePair("customFields", index)}
          onChange={(index, key, value) =>
            updatePair("customFields", index, key, value)
          }
        />
      </section>

      {/* اطلاعات مخفی */}
      <input
        type="hidden"
        name="filterValues"
        value={JSON.stringify(filterValues)}
      />

      <input
        type="hidden"
        name="customFields"
        value={JSON.stringify(customFields)}
      />

      {/* تصاویر */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">تصاویر محصول</h3>

        <ImageUploader
          value={images}
          onChange={setImages}
          onBusy={setUploading}
        />
      </section>

      {/* دکمه ذخیره و پیام‌ها */}
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {pending
            ? "در حال ذخیره..."
            : uploading
              ? "در حال آپلود عکس..."
              : isEdit
                ? "ذخیره تغییرات"
                : "ذخیره محصول"}
        </button>

        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-500">
            {state.error}
          </p>
        )}

        {state.ok && (
          <p
            role="status"
            className="text-sm font-medium text-green-600 dark:text-green-400"
          >
            {isEdit ? "تغییرات محصول ذخیره شد ✓" : "محصول اضافه شد ✓"}
          </p>
        )}
      </div>
    </form>
  );
}
