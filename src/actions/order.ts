"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/id";

// خطاهایی که پیامشان را به کاربر نشان می‌دهیم
class OrderError extends Error {}

const addressSchema = z.object({
  title: z.string().min(2, "عنوان آدرس را وارد کنید").max(40),
  province: z.string().min(2, "استان را وارد کنید"),
  city: z.string().min(2, "شهر را وارد کنید"),
  street: z.string().min(10, "آدرس را کامل‌تر وارد کنید"),
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
});

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(["product", "sim"]),
        qty: z.number().int().min(1).max(10),
        variantId: z.string().min(1).nullable().optional(),
      }),
    )
    .min(1, "سبد خرید خالی است")
    .max(30),
  addressId: z.string().optional(),
  address: addressSchema.optional(),
});

export type OrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrder(input: unknown): Promise<OrderResult> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return { ok: false, error: "ابتدا وارد حساب خود شوید" };
  }

  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است",
    };
  }

  const { items, addressId, address } = parsed.data;

  // جلوگیری از ثبت آیتم تکراری در سفارش
  const itemKeys = items.map((item) =>
    item.kind === "product"
      ? `product:${item.id}:${item.variantId ?? "no-variant"}`
      : `sim:${item.id}`,
  );

  if (new Set(itemKeys).size !== itemKeys.length) {
    return {
      ok: false,
      error: "آیتم تکراری در سبد خرید وجود دارد",
    };
  }

  if (!addressId && !address) {
    return { ok: false, error: "آدرس را انتخاب کنید" };
  }

  // سیم‌کارت نباید شناسه تنوع داشته باشد
  if (items.some((item) => item.kind === "sim" && item.variantId != null)) {
    return { ok: false, error: "اطلاعات سفارش نامعتبر است" };
  }

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      // ۱) بررسی یا ساخت آدرس
      let finalAddressId: string;

      if (addressId) {
        const a = await tx.address.findFirst({
          where: { id: addressId, userId },
        });

        if (!a) throw new OrderError("آدرس نامعتبر است");

        finalAddressId = a.id;
      } else {
        const a = await tx.address.create({
          data: {
            id: generateId(),
            ...address!,
            userId,
          },
        });

        finalAddressId = a.id;
      }

      // ۲) بررسی کالاها و محاسبه قیمت از دیتابیس
      let total = 0;

      const orderItems: {
        productId?: string;
        simId?: string;
        variantId?: string;
        qty: number;
        price: number;
      }[] = [];

      for (const it of items) {
        if (it.kind === "product") {
          const product = await tx.product.findUnique({
            where: { id: it.id },
            select: {
              id: true,
              title: true,
              price: true,
              discount: true,
              stock: true,
              ProductVariant: {
                where: { isActive: true },
                select: { id: true },
                take: 1,
              },
            },
          });

          if (!product) {
            throw new OrderError("یکی از کالاها پیدا نشد");
          }

          // محصول دارای تنوع
          if (it.variantId) {
            const variant = await tx.productVariant.findFirst({
              where: {
                id: it.variantId,
                productId: product.id,
                isActive: true,
              },
              select: {
                id: true,
                price: true,
                discount: true,
                stock: true,
              },
            });

            if (!variant) {
              throw new OrderError(
                `تنوع انتخاب‌شده برای «${product.title}» معتبر نیست`,
              );
            }

            // کاهش اتمیک موجودی تنوع
            const dec = await tx.productVariant.updateMany({
              where: {
                id: variant.id,
                productId: product.id,
                isActive: true,
                stock: { gte: it.qty },
              },
              data: {
                stock: { decrement: it.qty },
              },
            });

            if (dec.count === 0) {
              throw new OrderError(
                `موجودی تنوع انتخاب‌شده برای «${product.title}» کافی نیست`,
              );
            }

            const price = Math.round(
              variant.price * (1 - variant.discount / 100),
            );

            total += price * it.qty;

            orderItems.push({
              productId: product.id,
              variantId: variant.id,
              qty: it.qty,
              price,
            });
          } else {
            // اگر محصول تنوع داشته باشد، خرید بدون انتخاب تنوع ممنوع است
            if (product.ProductVariant.length > 0) {
              throw new OrderError(
                `لطفاً تنوع محصول «${product.title}» را انتخاب کنید`,
              );
            }

            // محصول بدون تنوع: رفتار قبلی
            const dec = await tx.product.updateMany({
              where: {
                id: product.id,
                stock: { gte: it.qty },
              },
              data: {
                stock: { decrement: it.qty },
              },
            });

            if (dec.count === 0) {
              throw new OrderError(`موجودی «${product.title}» کافی نیست`);
            }

            const price = Math.round(
              product.price * (1 - product.discount / 100),
            );

            total += price * it.qty;

            orderItems.push({
              productId: product.id,
              qty: it.qty,
              price,
            });
          }
        } else {
          // ۳) سیم‌کارت: فقط یک عدد و فقط در صورت موجود بودن
          const upd = await tx.simNumber.updateMany({
            where: {
              id: it.id,
              sold: false,
            },
            data: {
              sold: true,
            },
          });

          if (upd.count === 0) {
            throw new OrderError("این شماره دیگر موجود نیست");
          }

          const sim = await tx.simNumber.findUniqueOrThrow({
            where: { id: it.id },
          });

          total += sim.price;

          orderItems.push({
            simId: sim.id,
            qty: 1,
            price: sim.price,
          });
        }
      }

      // ۴) ساخت سفارش
      const order = await tx.order.create({
        data: {
          id: generateId(),
          userId,
          addressId: finalAddressId,
          total,
          OrderItem: {
            create: orderItems.map((item) => ({
              ...item,
              id: generateId(),
            })),
          },
        },
      });

      return order.id;
    });

    return { ok: true, orderId };
  } catch (e) {
    if (e instanceof OrderError) {
      return { ok: false, error: e.message };
    }

    console.error("createOrder failed:", e);

    return {
      ok: false,
      error: "خطا در ثبت سفارش، دوباره تلاش کنید",
    };
  }
}
