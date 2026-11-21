"use client";

import { useSyncExternalStore } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/store/cart";

type Props = {
  id: string;
  number: string;
  price: number;
};

const noop = () => () => {};

export default function AddSimButton({ id, number, price }: Props) {
  const add = useCart((s) => s.add);
  const inCartRaw = useCart((s) => s.items.some((i) => i.id === id));

  // جلوگیری از hydration mismatch
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const inCart = mounted && inCartRaw;

  return (
    <button
      type="button"
      onClick={() =>
        add({
          id,
          kind: "sim",
          title: `سیم‌کارت ${number}`,
          price,
          qty: 1,
        })
      }
      disabled={inCart}
      className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        inCart
          ? "cursor-not-allowed border border-border bg-surface text-muted"
          : "bg-brand text-white hover:bg-brand-dark"
      }`}
    >
      {inCart ? (
        <Check className="size-4" />
      ) : (
        <ShoppingCart className="size-4" />
      )}

      {inCart ? "در سبد شما" : "افزودن به سبد"}
    </button>
  );
}
