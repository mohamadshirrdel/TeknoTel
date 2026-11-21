import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/payment";
import { withOrderLock } from "@/lib/order-lock";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authority = url.searchParams.get("Authority") ?? "";

  const go = (pay: string, orderId?: string) => {
    const params = new URLSearchParams({ pay });

    if (orderId) {
      params.set("orderId", orderId);
    }

    return NextResponse.redirect(
      new URL(`/dashboard/orders?${params.toString()}`, req.url),
    );
  };

  if (!authority) {
    return go("invalid");
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { authority },
      select: {
        id: true,
        orderId: true,
      },
    });

    if (!payment) {
      return go("invalid");
    }

    // مرحله اول: بررسی وضعیت اولیه پرداخت و سفارش
    const snapshot = await withOrderLock(payment.orderId, async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { Order: true },
      });

      if (!currentPayment || currentPayment.authority !== authority) {
        return { kind: "INVALID" as const };
      }

      const order = currentPayment.Order;

      if (currentPayment.status === "PAID" && order.status === "PAID") {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            inquiryStartedAt: null,
          },
        });

        return {
          kind: "DONE" as const,
          orderId: order.id,
        };
      }

      if (
        currentPayment.status === "PAID" ||
        currentPayment.status === "PAID_REVIEW" ||
        currentPayment.status === "REFUND_PENDING" ||
        currentPayment.status === "REFUNDED"
      ) {
        return {
          kind: "REVIEW" as const,
          orderId: order.id,
        };
      }

      return {
        kind: "VERIFY" as const,
        paymentId: currentPayment.id,
        orderId: order.id,
        amount: currentPayment.amount,
      };
    });

    if (snapshot.kind === "INVALID") {
      return go("invalid");
    }

    if (snapshot.kind === "DONE") {
      return go("done", snapshot.orderId);
    }

    if (snapshot.kind === "REVIEW") {
      return go("review", snapshot.orderId);
    }

    // مرحله دوم: تأیید پرداخت خارج از تراکنش دیتابیس
    const verification = await verifyPayment(authority, snapshot.amount);

    if (verification.status === "UNKNOWN") {
      await withOrderLock(snapshot.orderId, async (tx) => {
        await tx.payment.updateMany({
          where: {
            id: snapshot.paymentId,
            authority,
            status: {
              in: ["REQUESTING", "PENDING", "UNKNOWN"],
            },
          },
          data: {
            status: "UNKNOWN",
            lastCheckedAt: new Date(),
          },
        });
      });

      return go("pending", snapshot.orderId);
    }

    if (verification.status === "FAILED") {
      await withOrderLock(snapshot.orderId, async (tx) => {
        await tx.payment.updateMany({
          where: {
            id: snapshot.paymentId,
            authority,
            status: {
              in: ["REQUESTING", "PENDING", "UNKNOWN"],
            },
          },
          data: {
            status: "FAILED",
            lastCheckedAt: new Date(),
            inquiryStartedAt: null,
          },
        });
      });

      return go("failed", snapshot.orderId);
    }

    // وضعیت‌هایی که هنوز نتیجه قطعی ندارند
    if (verification.status !== "PAID") {
      return go("pending", snapshot.orderId);
    }

    const refId = verification.refId;
    const now = new Date();

    // مرحله سوم: ثبت نتیجه با قفل مشترک
    const result = await withOrderLock(snapshot.orderId, async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: snapshot.paymentId },
        include: { Order: true },
      });

      if (!currentPayment || currentPayment.authority !== authority) {
        return { pay: "invalid" as const };
      }

      const order = currentPayment.Order;

      // Callback تکراری برای پرداخت موفق
      if (currentPayment.status === "PAID") {
        if (order.status === "PAID") {
          await tx.payment.update({
            where: { id: currentPayment.id },
            data: {
              refId: refId ?? currentPayment.refId,
              verifiedAt: currentPayment.verifiedAt ?? now,
              lastCheckedAt: now,
              inquiryStartedAt: null,
            },
          });

          return {
            pay: "done" as const,
            orderId: order.id,
          };
        }

        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "PAID_REVIEW",
            refId: refId ?? currentPayment.refId,
            verifiedAt: currentPayment.verifiedAt ?? now,
            lastCheckedAt: now,
            inquiryStartedAt: null,
            failureMessage:
              "پرداخت موفق بوده اما وضعیت سفارش با وضعیت پرداخت مطابقت ندارد",
          },
        });

        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // پرداخت قبلاً نیازمند بررسی ویژه شده است
      if (currentPayment.status === "PAID_REVIEW") {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            refId: refId ?? currentPayment.refId,
            verifiedAt: currentPayment.verifiedAt ?? now,
            lastCheckedAt: now,
            inquiryStartedAt: null,
          },
        });

        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // وضعیت‌های مرتبط با بازپرداخت نباید تغییر کنند
      if (
        currentPayment.status === "REFUND_PENDING" ||
        currentPayment.status === "REFUNDED"
      ) {
        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // فقط این وضعیت‌ها اجازه تبدیل به PAID را دارند
      if (
        !["REQUESTING", "PENDING", "UNKNOWN"].includes(currentPayment.status)
      ) {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "PAID_REVIEW",
            refId,
            verifiedAt: now,
            lastCheckedAt: now,
            inquiryStartedAt: null,
            failureMessage:
              "درگاه پرداخت را موفق اعلام کرده اما وضعیت قبلی پرداخت مجاز به تکمیل خودکار نیست",
          },
        });

        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // بررسی مجدد مبلغ
      if (currentPayment.amount !== order.total) {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "PAID_REVIEW",
            refId,
            verifiedAt: now,
            lastCheckedAt: now,
            inquiryStartedAt: null,
            failureMessage:
              "پرداخت موفق بوده اما مبلغ آن با مبلغ سفارش مطابقت ندارد",
          },
        });

        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // سفارش لغوشده نباید دوباره فعال شود
      if (order.status === "CANCELED") {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "PAID_REVIEW",
            refId,
            verifiedAt: now,
            lastCheckedAt: now,
            inquiryStartedAt: null,
            failureMessage:
              "پرداخت موفق برای سفارش لغوشده؛ نیازمند بررسی و تعیین تکلیف",
          },
        });

        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // Authority پرداخت باید با Authority سفارش یکسان باشد
      if (order.authority !== authority) {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "PAID_REVIEW",
            refId,
            verifiedAt: now,
            lastCheckedAt: now,
            inquiryStartedAt: null,
            failureMessage: "Authority پرداخت با Authority سفارش مطابقت ندارد",
          },
        });

        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // اگر سفارش قبلاً پرداخت شده باشد، فقط Payment را همگام می‌کنیم
      if (order.status === "PAID") {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "PAID",
            refId,
            verifiedAt: now,
            lastCheckedAt: now,
            failureCode: null,
            failureMessage: null,
            inquiryStartedAt: null,
          },
        });

        return {
          pay: "done" as const,
          orderId: order.id,
        };
      }

      // فقط سفارش در انتظار پرداخت قابل تکمیل است
      if (order.status !== "PENDING") {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "PAID_REVIEW",
            refId,
            verifiedAt: now,
            lastCheckedAt: now,
            inquiryStartedAt: null,
            failureMessage: "پرداخت موفق بوده اما وضعیت سفارش قابل تکمیل نیست",
          },
        });

        return {
          pay: "review" as const,
          orderId: order.id,
        };
      }

      // ثبت هم‌زمان سفارش و پرداخت
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
        },
      });

      await tx.payment.update({
        where: { id: currentPayment.id },
        data: {
          status: "PAID",
          refId,
          verifiedAt: now,
          lastCheckedAt: now,
          failureCode: null,
          failureMessage: null,
          inquiryStartedAt: null,
        },
      });

      return {
        pay: "ok" as const,
        orderId: order.id,
      };
    });

    return go(result.pay, result.orderId);
  } catch (error) {
    console.error("Payment verification failed:", error);
    return go("error");
  }
}
