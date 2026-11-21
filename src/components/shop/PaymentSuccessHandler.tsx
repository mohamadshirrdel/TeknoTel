"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/store/cart";

type Props = {
  pay?: string;
  orderId?: string;
};

export default function PaymentSuccessHandler({ pay, orderId }: Props) {
  const clear = useCart((state) => state.clear);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || !orderId || (pay !== "ok" && pay !== "done")) {
      return;
    }

    handled.current = true;
    clear();
  }, [pay, orderId, clear]);

  return null;
}
