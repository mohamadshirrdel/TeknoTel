import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";

type Props = {
  slug: string;
  title: string;
  image: string;
  price: number;
  discount?: number;
};

const fa = (n: number) => n.toLocaleString("fa-IR");

export default function ProductCard({
  slug,
  title,
  image,
  price,
  discount = 0,
}: Props) {
  const final = Math.round(price * (1 - discount / 100));

  return (
    <Link
      href={`/product/${slug}`}
      className="group flex h-full min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-gray-200/50 sm:p-3 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand/40 dark:hover:shadow-black/20"
    >
      {/* تصویر محصول */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-4"
        />

        {/* برچسب تخفیف */}
        {discount > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-brand px-2 py-1 text-[10px] font-bold text-white shadow-sm sm:text-xs">
            <Tag className="size-3" />
            {fa(discount)}٪ تخفیف
          </span>
        )}
      </div>

      {/* عنوان محصول */}
      <h3 className="mt-3 line-clamp-2 min-h-11 text-xs leading-6 font-semibold text-gray-800 transition-colors group-hover:text-brand sm:mt-4 sm:text-sm dark:text-gray-100">
        {title}
      </h3>

      {/* قیمت محصول */}
      <div className="mt-auto pt-3">
        {/* قیمت قبلی */}
        <div className="flex min-h-5 items-center justify-end">
          {discount > 0 && (
            <span className="text-[10px] text-gray-400 line-through sm:text-xs dark:text-gray-500">
              {fa(price)}
            </span>
          )}
        </div>

        {/* قیمت نهایی */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-500 transition-all duration-300 group-hover:bg-brand group-hover:text-white sm:size-9 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-brand dark:group-hover:text-white">
            <ArrowLeft className="size-4" />
          </span>

          <div className="min-w-0 text-left">
            <div className="flex items-center justify-end gap-1">
              <span className="truncate text-sm font-black text-gray-900 sm:text-base dark:text-white">
                {fa(final)}
              </span>

              <span className="shrink-0 text-[10px] text-gray-400 sm:text-xs dark:text-gray-500">
                تومان
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
