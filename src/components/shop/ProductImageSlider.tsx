"use client";

import Image from "next/image";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  title: string;
};

export default function ProductImageSlider({ images, title }: Props) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  const productImages = images.length > 0 ? images : ["/placeholder.png"];

  return (
    <div className="product-gallery min-w-0">
      {/* Main Slider */}
      <div className="relative">
        <Swiper
          modules={[Navigation, Thumbs, Autoplay]}
          navigation={{
            prevEl: ".product-prev",
            nextEl: ".product-next",
          }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          autoplay={
            productImages.length > 1
              ? {
                  delay: 3500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          loop={productImages.length > 1}
          speed={700}
          className="overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800"
        >
          {productImages.map((src, index) => (
            <SwiperSlide key={`${src}-${index}`}>
              <div className="relative aspect-square">
                <Image
                  src={src}
                  alt={`${title} - تصویر ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-5 sm:p-8"
                  priority={index === 0}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
        {productImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="تصویر قبلی"
              className="product-prev absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl border border-gray-200 bg-white/90 text-gray-700 shadow-sm backdrop-blur transition hover:border-brand hover:bg-brand hover:text-white sm:size-10 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:border-brand dark:hover:bg-brand dark:hover:text-white"
            >
              <ChevronRight className="size-5" />
            </button>

            <button
              type="button"
              aria-label="تصویر بعدی"
              className="product-next absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl border border-gray-200 bg-white/90 text-gray-700 shadow-sm backdrop-blur transition hover:border-brand hover:bg-brand hover:text-white sm:size-10 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:border-brand dark:hover:bg-brand dark:hover:text-white"
            >
              <ChevronLeft className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Slider */}
      {productImages.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          watchSlidesProgress
          spaceBetween={10}
          slidesPerView="auto"
          className="product-thumbs mt-3"
        >
          {productImages.map((src, index) => (
            <SwiperSlide key={`${src}-${index}`} className="!w-16 sm:!w-20">
              <div className="relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800">
                <Image
                  src={src}
                  alt={`${title} - تصویر کوچک ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1.5"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}