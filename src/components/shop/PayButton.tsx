"use client";

import { useState, useTransition } from "react";
import { payOrder } from "@/actions/payment";

export default function PayButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function pay() {
    setError("");
    start(async () => {
      const res = await payOrder(orderId);
      if (!res.ok) return setError(res.error);
      window.location.href = res.url;
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={pay}
        disabled={pending}
        className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "در حال اتصال..." : "پرداخت"}
      </button>
      {error && <span className="text-xs text-brand">{error}</span>}
    </div>
  );
}
