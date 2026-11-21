"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/id";
import { withOrderLock } from "@/lib/order-lock";
import { startPayment, getPaymentUrl, PaymentStartError } from "@/lib/payment";

export type PayResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function payOrder(orderId: string): Promise<PayResult> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return {
      ok: false,
      error: "ابتدا وارد حساب خود شوید",
    };
  }

  if (!orderId || typeof orderId !== "string" || orderId.length > 100) {
    return {
      ok: false,
      error: "شناسه سفارش نامعتبر است",
    };
  }

  // مرحله اول: آماده‌سازی پرداخت در دیتابیس
  const preparation = await withOrderLock(orderId, async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: "PENDING",
      },
    });

    if (!order) {
      return {
        kind: "ERROR" as const,
        error: "سفارش پیدا نشد یا قبلاً پرداخت شده است",
      };
    }

    // درخواست پرداخت قبلی هنوز تعیین تکلیف نشده است.
    if (order.authority?.startsWith("REQUESTING-")) {
      return {
        kind: "ERROR" as const,
        error:
          "درخواست پرداخت قبلی هنوز تعیین تکلیف نشده است؛ فعلاً دوباره تلاش نکنید",
      };
    }

    // سازگاری با Authority سفارش‌های قدیمی
    if (order.authority) {
      let payment = await tx.payment.findUnique({
        where: {
          authority: order.authority,
        },
      });

      // سازگاری با سفارش‌های قدیمی
      if (!payment) {
        payment = await tx.payment.create({
          data: {
            id: generateId(),
            updatedAt: new Date(),
            orderId: order.id,
            amount: order.total,
            authority: order.authority,
            status: "UNKNOWN",
            requestedAt: order.paymentRequestedAt ?? order.createdAt,
            failureMessage: "Payment record migrated from legacy order",
          },
        });
      }

      // بررسی تطابق پرداخت با سفارش
      if (payment.orderId !== order.id || payment.amount !== order.total) {
        return {
          kind: "ERROR" as const,
          error: "اطلاعات پرداخت قبلی با سفارش مطابقت ندارد",
        };
      }

      // فقط پرداخت در انتظار را می‌توان مجدداً به درگاه هدایت کرد.
      if (payment.status !== "PENDING") {
        return {
          kind: "ERROR" as const,
          error:
            "وضعیت پرداخت قبلی هنوز تعیین تکلیف نشده است؛ برای جلوگیری از پرداخت تکراری، با پشتیبانی تماس بگیرید",
        };
      }

      return {
        kind: "EXISTING" as const,
        authority: payment.authority!,
      };
    }

    // ایجاد رکورد مستقل برای تلاش جدید
    const payment = await tx.payment.create({
      data: {
        id: generateId(),
        updatedAt: new Date(),
        orderId: order.id,
        amount: order.total,
        status: "REQUESTING",
        requestedAt: new Date(),
      },
    });

    // شناسه درخواست از شناسه رکورد پرداخت ساخته می‌شود.
    const requestMarker = `REQUESTING-${payment.id}`;

    const locked = await tx.order.updateMany({
      where: {
        id: order.id,
        userId,
        status: "PENDING",
        authority: null,
      },
      data: {
        authority: requestMarker,
        paymentRequestedAt: payment.requestedAt,
      },
    });

    if (locked.count !== 1) {
      throw new Error("ثبت درخواست پرداخت ناموفق بود");
    }

    return {
      kind: "START" as const,
      order,
      paymentId: payment.id,
      requestMarker,
    };
  });

  if (preparation.kind === "ERROR") {
    return {
      ok: false,
      error: preparation.error,
    };
  }

  if (preparation.kind === "EXISTING") {
    return {
      ok: true,
      url: getPaymentUrl(preparation.authority),
    };
  }

  const { order, paymentId, requestMarker } = preparation;

  let createdAuthority: string | null = null;

  try {
    // مرحله دوم: درخواست به درگاه خارج از تراکنش
    const { authority, paymentUrl } = await startPayment(order);

    createdAuthority = authority;

    // مرحله سوم: ثبت نتیجه درخواست در دیتابیس
    const saved = await withOrderLock(order.id, async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: {
          id: order.id,
        },
      });

      if (
        !currentOrder ||
        currentOrder.status !== "PENDING" ||
        currentOrder.authority !== requestMarker
      ) {
        // پرداخت ایجاد شده اما سفارش دیگر قابل ادامه نیست.
        // اطلاعات پرداخت را حفظ می‌کنیم تا گم نشود.
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            authority,
            status: "REVIEW",
            inquiryStartedAt: null,
            failureMessage:
              "درگاه پرداخت ایجاد شده اما وضعیت سفارش تغییر کرده است",
          },
        });

        return false;
      }

      await tx.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          authority,
          status: "PENDING",
        },
      });

      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          userId,
          status: "PENDING",
          authority: requestMarker,
        },
        data: {
          authority,
        },
      });

      if (updated.count !== 1) {
        await tx.payment.updateMany({
          where: {
            id: paymentId,
            authority,
            status: "PENDING",
          },
          data: {
            status: "REVIEW",
            failureMessage: "Payment authority saved but order update failed",
          },
        });

        return false;
      }

      return true;
    });

    if (!saved) {
      return {
        ok: false,
        error:
          "درخواست پرداخت ایجاد شده اما وضعیت سفارش تغییر کرده است؛ پرداخت نیازمند بررسی پشتیبانی است",
      };
    }

    return {
      ok: true,
      url: paymentUrl,
    };
  } catch (error) {
    console.error("payOrder failed:", error);

    // فقط خطای قطعی اجازه آزادسازی درخواست را می‌دهد.
    if (error instanceof PaymentStartError && error.safeToRetry) {
      try {
        await withOrderLock(order.id, async (tx) => {
          await tx.payment.updateMany({
            where: {
              id: paymentId,
              status: "REQUESTING",
            },
            data: {
              status: "FAILED",
              failureMessage: error.message,
            },
          });

          await tx.order.updateMany({
            where: {
              id: order.id,
              userId,
              status: "PENDING",
              authority: requestMarker,
            },
            data: {
              authority: null,
              paymentRequestedAt: null,
            },
          });
        });
      } catch (releaseError) {
        console.error("Payment lock release failed:", releaseError);
      }

      return {
        ok: false,
        error: error.message,
      };
    }

    // نتیجه نامشخص: رکورد حفظ می‌شود و درخواست دوباره آزاد نمی‌شود.
    try {
      await withOrderLock(order.id, async (tx) => {
        await tx.payment.updateMany({
          where: {
            id: paymentId,
            status: "REQUESTING",
          },
          data: {
            status: "UNKNOWN",
            ...(createdAuthority && {
              authority: createdAuthority,
            }),
            failureMessage: "نتیجه درخواست ایجاد پرداخت مشخص نیست",
          },
        });

        // اگر Authority از درگاه دریافت شده باشد،
        // آن را روی سفارش هم ذخیره می‌کنیم.
        if (createdAuthority) {
          await tx.order.updateMany({
            where: {
              id: order.id,
              userId,
              status: "PENDING",
              authority: requestMarker,
            },
            data: {
              authority: createdAuthority,
            },
          });
        }
      });
    } catch (updateError) {
      console.error("Payment status update failed:", updateError);
    }

    return {
      ok: false,
      error:
        "نتیجه درخواست پرداخت مشخص نیست. برای جلوگیری از پرداخت تکراری، فعلاً دوباره تلاش نکنید.",
    };
  }
}
