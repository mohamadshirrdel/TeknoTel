"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Check, PackageX } from "lucide-react";
import { useCart } from "@/store/cart";

type SelectedOption = {
  name: string;
  value: string;
};

type Props = {
  id: string;
  title: string;
  price: number;
  stock: number;
  variantId?: string;
  selectedOptions?: SelectedOption[];
  disabled?: boolean;
};

export default function AddToCartButton({
  id,
  title,
  price,
  stock,
  variantId,
  selectedOptions = [],
  disabled = false,
}: Props) {
  const add = useCart((s) => s.add);

  const [added, setAdded] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOutOfStock = stock <= 0;
  const isDisabled = disabled || isOutOfStock;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleClick() {
    if (isDisabled) return;

    add({
      id,
      kind: "product",
      title,
      price,
      qty: 1,
      variantId,
      selectedOptions,
    });

    setAdded(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setAdded(false);
      timerRef.current = null;
    }, 1800);
  }

  // ناموجود یا انتخاب نشدن تنوع
  if (isDisabled) {
    const message =
      isOutOfStock && (!disabled || variantId)
        ? "این محصول ناموجود است"
        : "ابتدا تنوع محصول را انتخاب کنید";

    return (
      <button
        type="button"
        disabled
        className="flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
      >
        <PackageX className="size-5 shrink-0" />
        {message}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className={`group relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 sm:text-base ${
        added
          ? "bg-green-600 shadow-green-600/20"
          : "bg-brand shadow-brand/20 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/25 active:translate-y-0"
      }`}
    >
      {added ? (
        <>
          <Check className="size-5 animate-in zoom-in duration-200" />
          <span>با موفقیت به سبد خرید اضافه شد</span>
        </>
      ) : (
        <>
          <ShoppingCart className="size-5 transition-transform duration-300 group-hover:scale-110" />
          <span>افزودن به سبد خرید</span>
        </>
      )}
    </button>
  );
}