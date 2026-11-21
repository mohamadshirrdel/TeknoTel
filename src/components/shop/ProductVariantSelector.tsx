"use client";

import { useMemo, useState } from "react";
import { Check, Package, ShoppingBag } from "lucide-react";
import AddToCartButton from "@/components/shop/AddToCartButton";

type OptionValue = {
  id: string;
  value: string;
  label: string;
  colorHex: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  values: OptionValue[];
};

type Variant = {
  id: string;
  price: number;
  discount: number;
  stock: number;
  values: {
    optionValue: {
      id: string;
      optionId: string;
      value: string;
      label: string;
      option: {
        id: string;
        name: string;
      };
    };
  }[];
};

type SelectedOption = {
  name: string;
  value: string;
};

type Props = {
  productId: string;
  title: string;
  options: ProductOption[];
  variants: Variant[];
  fallbackPrice: number;
  fallbackStock: number;
};

export default function ProductVariantSelector({
  productId,
  title,
  options,
  variants,
  fallbackPrice,
  fallbackStock,
}: Props) {
  const [selected, setSelected] = useState<Record<string, string>>({});

  const selectedVariant = useMemo(() => {
    if (Object.keys(selected).length !== options.length) return null;

    return variants.find((variant) => {
      const variantValueIds = variant.values.map((item) => item.optionValue.id);

      return (
        variantValueIds.length === options.length &&
        options.every((option) => variantValueIds.includes(selected[option.id]))
      );
    });
  }, [selected, options, variants]);

  const selectedOptions: SelectedOption[] = useMemo(() => {
    return options
      .map((option) => {
        const selectedValue = option.values.find(
          (value) => value.id === selected[option.id],
        );

        if (!selectedValue) return null;

        return {
          name: option.name,
          value: selectedValue.label,
        };
      })
      .filter((item): item is SelectedOption => item !== null);
  }, [selected, options]);

  const finalPrice = selectedVariant
    ? Math.round(selectedVariant.price * (1 - selectedVariant.discount / 100))
    : fallbackPrice;

  const hasSelection = Object.keys(selected).length === options.length;

  const formatPrice = (price: number) => price.toLocaleString("fa-IR");

  // محصول بدون تنوع
  if (options.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            وضعیت موجودی
          </span>

          <span
            className={`flex items-center gap-1.5 text-sm font-bold ${
              fallbackStock > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-500"
            }`}
          >
            <Package className="size-4" />
            {fallbackStock > 0
              ? `${formatPrice(fallbackStock)} عدد موجود`
              : "ناموجود"}
          </span>
        </div>

        <AddToCartButton
          id={productId}
          title={title}
          price={fallbackPrice}
          stock={fallbackStock}
          selectedOptions={[]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Variant Options */}
      {options.map((option) => (
        <div key={option.id}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              انتخاب {option.name}
            </h3>

            {selected[option.id] && (
              <span className="text-xs text-brand">
                {
                  option.values.find(
                    (value) => value.id === selected[option.id],
                  )?.label
                }
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const active = selected[option.id] === value.id;

              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() =>
                    setSelected((prev) => ({
                      ...prev,
                      [option.id]: value.id,
                    }))
                  }
                  aria-pressed={active}
                  className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                    active
                      ? "border-brand bg-red-50 text-brand shadow-sm dark:bg-red-950/30"
                      : "border-gray-200 bg-white text-gray-700 hover:border-brand/50 hover:text-brand dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-brand/50"
                  }`}
                >
                  {value.colorHex && (
                    <span
                      className="size-4 shrink-0 rounded-full border border-gray-300 dark:border-gray-500"
                      style={{ backgroundColor: value.colorHex }}
                    />
                  )}

                  <span>{value.label}</span>

                  {active && <Check className="size-4" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Invalid Combination */}
      {hasSelection && !selectedVariant && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          این ترکیب از محصول موجود نیست.
        </div>
      )}

      {/* Selected Variant Information */}
      {selectedVariant && (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/70">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              قیمت محصول
            </span>

            <div className="text-left">
              {selectedVariant.discount > 0 && (
                <p className="mb-1 text-xs text-gray-400 line-through dark:text-gray-500">
                  {formatPrice(selectedVariant.price)} تومان
                </p>
              )}

              <p className="text-lg font-black text-gray-900 dark:text-white">
                {formatPrice(finalPrice)}
                <span className="mr-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                  تومان
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              وضعیت موجودی
            </span>

            <span
              className={`flex items-center gap-1.5 text-sm font-bold ${
                selectedVariant.stock > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500"
              }`}
            >
              <Package className="size-4" />

              {selectedVariant.stock > 0
                ? `${formatPrice(selectedVariant.stock)} عدد موجود`
                : "ناموجود"}
            </span>
          </div>
        </div>
      )}

      {/* Add To Cart */}
      <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <AddToCartButton
          id={productId}
          title={title}
          price={finalPrice}
          stock={selectedVariant?.stock ?? 0}
          variantId={selectedVariant?.id}
          selectedOptions={selectedOptions}
          disabled={!selectedVariant || selectedVariant.stock <= 0}
        />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <ShoppingBag className="size-4" />
        خرید آسان و مطمئن از تکنوتل
      </div>
    </div>
  );
}
