"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

type Item = {
  slug: string;
  title: string;
  price: number;
  discount: number;
};

const fa = (n: number) => n.toLocaleString("fa-IR");

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLFormElement>(null);

  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) return;

    const ctrl = new AbortController();

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });

        if (res.ok) {
          setItems(await res.json());
          setOpen(true);
        }
      } catch {
        // درخواست لغوشده نادیده گرفته می‌شود.
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const show = open && term.length >= 2 && items.length > 0;

  return (
    <form ref={ref} action="/search" className="relative w-full">
      {/* کادر جست‌وجو */}
      <div
        className={`flex h-11 items-center rounded-xl border transition-all sm:h-12 sm:rounded-2xl ${
          open
            ? "border-brand/50 bg-white ring-4 ring-brand/5 dark:bg-gray-800"
            : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
        }`}
      >
        <Search className="mr-3 size-5 shrink-0 text-gray-400 sm:mr-4" />

        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          maxLength={50}
          autoComplete="off"
          placeholder="جستجوی گوشی، سیم‌کارت، لوازم جانبی و ..."
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs text-gray-800 outline-none placeholder:text-gray-400 sm:px-3 sm:text-sm dark:text-gray-100"
        />

        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setItems([]);
              setOpen(false);
            }}
            aria-label="پاک کردن جستجو"
            className="ml-1 grid size-8 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <X className="size-4" />
          </button>
        )}

        <button
          type="submit"
          aria-label="جستجو"
          className="ml-1.5 mr-1 grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white transition hover:bg-brand-dark sm:size-9 sm:rounded-xl"
        >
          <Search className="size-4" />
        </button>
      </div>

      {/* پیشنهادهای جست‌وجو */}
      {show && (
        <div className="absolute inset-x-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-4 py-3 text-xs font-bold text-gray-500 dark:border-gray-800 dark:text-gray-400">
            پیشنهادهای جستجو
          </div>

          <ul>
            {items.map((p) => {
              const final = Math.round(p.price * (1 - p.discount / 100));

              return (
                <li key={p.slug}>
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="line-clamp-1 font-medium text-gray-800 dark:text-gray-100">
                      {p.title}
                    </span>

                    <span className="shrink-0 text-xs font-bold text-brand">
                      {fa(final)} تومان
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href={`/search?q=${encodeURIComponent(term)}`}
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-sm font-bold text-brand transition hover:bg-red-50 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            مشاهده همه نتایج
          </Link>
        </div>
      )}
    </form>
  );
}
