"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X, Star } from "lucide-react";
import { MAX_IMAGES } from "@/lib/product-options";

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  onBusy: (busy: boolean) => void;
};

const fa = (n: number) => n.toLocaleString("fa-IR");

export default function ImageUploader({ value, onChange, onBusy }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(0);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (files.length === 0) return;

    const room = MAX_IMAGES - value.length;

    if (room <= 0) {
      setError(`حداکثر ${fa(MAX_IMAGES)} عکس مجاز است`);
      return;
    }

    const picked = files.slice(0, room);
    const errors: string[] = [];

    setError(
      files.length > room ? `فقط ${fa(room)} عکس دیگر قابل افزودن بود` : "",
    );

    onBusy(true);
    setUploading(picked.length);

    const urls: string[] = [];

    try {
      for (const file of picked) {
        try {
          const fd = new FormData();
          fd.append("file", file);

          const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: fd,
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && typeof data.url === "string" && data.url) {
            urls.push(data.url);
          } else {
            errors.push(data.error ?? "آپلود یکی از تصاویر ناموفق بود");
          }
        } catch {
          errors.push("خطا در ارتباط با سرور هنگام آپلود تصویر");
        } finally {
          setUploading((n) => Math.max(0, n - 1));
        }
      }

      if (urls.length > 0) {
        onChange([...value, ...urls]);
      }

      if (errors.length > 0) {
        setError(errors.join(" - "));
      }
    } finally {
      setUploading(0);
      onBusy(false);
    }
  }

  const isUploading = uploading > 0;

  return (
    <div className="space-y-3">
      {/* عنوان */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-ink">عکس‌های محصول</h3>
          <p className="mt-1 text-xs text-muted">
            اولین تصویر به‌عنوان تصویر اصلی محصول نمایش داده می‌شود.
          </p>
        </div>

        <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
          {fa(value.length)} از {fa(MAX_IMAGES)} تصویر
        </span>
      </div>

      {/* تصاویر */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {value.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
          >
            <Image
              src={url}
              alt={`تصویر محصول ${fa(i + 1)}`}
              fill
              sizes="(max-width: 640px) 30vw, 120px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />

            {/* تصویر اصلی */}
            {i === 0 && (
              <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-lg bg-brand px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                <Star className="size-3 fill-current" />
                اصلی
              </span>
            )}

            {/* حذف تصویر */}
            <button
              type="button"
              aria-label={`حذف تصویر ${fa(i + 1)}`}
              disabled={isUploading}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute left-1.5 top-1.5 grid size-7 place-items-center rounded-lg bg-black/65 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="size-4" />
            </button>

            {/* انتخاب تصویر اصلی */}
            {i > 0 && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() =>
                  onChange([url, ...value.filter((_, j) => j !== i)])
                }
                className="absolute inset-x-1 bottom-1.5 rounded-lg bg-black/70 px-1 py-2 text-[10px] font-medium text-white opacity-100 transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
              >
                انتخاب تصویر اصلی
              </button>
            )}

            {/* ارسال تصاویر به سرور */}
            <input type="hidden" name="images" value={url} />
          </div>
        ))}

        {/* وضعیت آپلود */}
        {Array.from({ length: uploading }).map((_, i) => (
          <div
            key={`loading-${i}`}
            className="flex aspect-square animate-pulse flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface text-xs text-muted"
          >
            <ImagePlus className="size-6" />
            <span>در حال آپلود...</span>
          </div>
        ))}

        {/* افزودن تصویر */}
        {value.length + uploading < MAX_IMAGES && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface text-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="افزودن تصویر محصول"
          >
            <ImagePlus className="size-7" />
            <span className="text-xs font-medium">افزودن تصویر</span>
          </button>
        )}
      </div>

      {/* راهنما */}
      <p className="text-xs leading-6 text-muted">
        فرمت‌های مجاز: JPEG، PNG و WebP
      </p>

      {/* انتخاب فایل */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={onPick}
      />

      {/* خطا */}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs leading-6 text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}
