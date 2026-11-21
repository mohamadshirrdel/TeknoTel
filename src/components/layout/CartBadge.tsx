"use client";

import { useSyncExternalStore } from "react";
import { useCart } from "@/store/cart";

const noop = () => () => {};

export default function CartBadge() {
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  // سبد در localStorage ذخیره می‌شود. روی سرور خالی است، پس تا بعد از mount چیزی نشان نمی‌دهیم
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  if (!mounted || count === 0) return null;

  return (
    <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] text-white">
      {count.toLocaleString("fa-IR")}
    </span>
  );
}
