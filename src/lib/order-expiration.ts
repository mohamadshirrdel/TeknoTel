import { generateId } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { inquiryPayment, verifyPayment } from "@/lib/payment";
import { withOrderLock } from "@/lib/order-lock";
import { restoreOrderItems } from "@/lib/restore-order-items";

const INQUIRY_LOCK_MINUTES = 2;

// آزادسازی قفل استعلام
async function releaseInquiryLock(
  orderId: string,
  paymentId: string,
  authority: string,
  claimedAt: Date,
) {
  await withOrderLock(orderId, async (tx) => {
    await tx.payment.updateMany({
      where: {
        id: paymentId,
        orderId,
        authority,
        inquiryStartedAt: claimedAt,
      },
      data: {
        inquiryStartedAt: null,
      },
    });
  });
}

// رزرو قفل استعلام
async function claimInquiryLock(
  orderId: string,
  paymentId: string,
  authority: string,
) {
  const claimedAt = new Date();

  const lockExpiredBefore = new Date(
    claimedAt.getTime() - INQUIRY_LOCK_MINUTES * 60 * 1000,
  );

  const result = await withOrderLock(orderId, async (tx) => {
    return tx.payment.updateMany({
      where: {
        id: paymentId,
        orderId,
        authority,
        status: {
          in: ["PENDING", "UNKNOWN"],
        },
        OR: [
          { inquiryStartedAt: null },
          { inquiryStartedAt: { lt: lockExpiredBefore } },
        ],
      },
      data: {
        inquiryStartedAt: claimedAt,
      },
    });
  });

  return result.count === 1 ? claimedAt : null;
}

export async function expirePendingOrders() {
  const ttlMinutes = Number(process.env.ORDER_TTL_MINUTES ?? 30);
  const stuckMinutes = Number(process.env.PAYMENT_REQUEST_STUCK_MINUTES ?? 10);

  if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
    throw new Error("ORDER_TTL_MINUTES نامعتبر است");
  }

  if (!Number.isFinite(stuckMinutes) || stuckMinutes <= 0) {
    throw new Error("PAYMENT_REQUEST_STUCK_MINUTES نامعتبر است");
  }

  const now = new Date();

  const expiresBefore = new Date(now.getTime() - ttlMinutes * 60 * 1000);
  const stuckBefore = new Date(now.getTime() - stuckMinutes * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: {
        lt: expiresBefore,
      },
    },
    select: {
      id: true,
    },
  });

  let expiredCount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let reviewCount = 0;

  for (const order of orders) {
    try {
      // مرحله اول: بررسی سفارش و پرداخت با قفل
      const snapshot = await withOrderLock(order.id, async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: {
            id: order.id,
          },
        });

        if (
          !currentOrder ||
          currentOrder.status !== "PENDING" ||
          currentOrder.createdAt >= expiresBefore
        ) {
          return { kind: "SKIPPED" as const };
        }

        const authority = currentOrder.authority;
        const requestedAt = currentOrder.paymentRequestedAt;

        // هیچ درخواست پرداختی شروع نشده است.
        if (!authority && !requestedAt) {
          const canceled = await tx.order.updateMany({
            where: {
              id: currentOrder.id,
              status: "PENDING",
              authority: null,
              paymentRequestedAt: null,
            },
            data: {
              status: "CANCELED",
            },
          });

          if (canceled.count !== 1) {
            return { kind: "SKIPPED" as const };
          }

          const items = await tx.orderItem.findMany({
            where: {
              orderId: currentOrder.id,
            },
          });

          await restoreOrderItems(tx, items);

          return { kind: "EXPIRED" as const };
        }

        // درخواست پرداخت هنوز Authority ندارد یا در حالت REQUESTING است.
        if (
          authority?.startsWith("REQUESTING-") ||
          (!authority && requestedAt)
        ) {
          const isStuck = !requestedAt || requestedAt < stuckBefore;

          if (!isStuck) {
            return { kind: "PENDING" as const };
          }

          // استخراج شناسه Payment از نشانگر درخواست
          const paymentId = authority?.startsWith("REQUESTING-")
            ? authority.slice("REQUESTING-".length)
            : null;

          if (paymentId) {
            await tx.payment.updateMany({
              where: {
                id: paymentId,
                orderId: currentOrder.id,
                status: "REQUESTING",
              },
              data: {
                status: "REVIEW",
                lastCheckedAt: now,
                failureMessage:
                  "درخواست ایجاد پرداخت بیش از زمان مجاز در حالت نامشخص باقی مانده است",
              },
            });
          } else {
            // سازگاری با درخواست‌های قدیمی
            await tx.payment.updateMany({
              where: {
                orderId: currentOrder.id,
                status: {
                  in: ["REQUESTING", "PENDING", "UNKNOWN"],
                },
              },
              data: {
                status: "REVIEW",
                lastCheckedAt: now,
                failureMessage: "درخواست پرداخت قدیمی فاقد Authority معتبر است",
              },
            });
          }

          console.warn(
            `[PAYMENT REVIEW] Stuck payment request: ${currentOrder.id}`,
          );

          return { kind: "REVIEW" as const };
        }

        if (!authority) {
          return { kind: "REVIEW" as const };
        }

        // پیدا کردن رکورد پرداخت
        let payment = await tx.payment.findUnique({
          where: {
            authority,
          },
        });

        // سازگاری با سفارش‌های قدیمی که Payment ندارند.
        if (!payment) {
          payment = await tx.payment.create({
            data: {
              id: generateId(),
              updatedAt: new Date(),
              orderId: currentOrder.id,
              amount: currentOrder.total,
              authority,
              status: "PENDING",
              requestedAt:
                currentOrder.paymentRequestedAt ?? currentOrder.createdAt,
            },
          });
        }

        if (payment.orderId !== currentOrder.id) {
          return { kind: "REVIEW" as const };
        }

        if (!["PENDING", "UNKNOWN"].includes(payment.status)) {
          return { kind: "REVIEW" as const };
        }

        if (
          payment.status === "PAID" ||
          payment.status === "PAID_REVIEW" ||
          payment.status === "FAILED" ||
          payment.status === "REVIEW" ||
          payment.status === "REFUND_PENDING" ||
          payment.status === "REFUNDED"
        ) {
          return { kind: "REVIEW" as const };
        }

        return {
          kind: "CHECK_PAYMENT" as const,
          authority,
          orderId: currentOrder.id,
          paymentId: payment.id,
          amount: payment.amount,
        };
      });

      if (snapshot.kind === "SKIPPED") {
        continue;
      }

      if (snapshot.kind === "EXPIRED") {
        expiredCount++;
        continue;
      }

      if (snapshot.kind === "PENDING") {
        pendingCount++;
        continue;
      }

      if (snapshot.kind === "REVIEW") {
        reviewCount++;
        continue;
      }

      // رزرو پرداخت برای جلوگیری از استعلام هم‌زمان
      const claimedAt = await claimInquiryLock(
        snapshot.orderId,
        snapshot.paymentId,
        snapshot.authority,
      );

      // اگر پرداخت قبلاً توسط اجرای دیگری رزرو شده باشد
      if (!claimedAt) {
        pendingCount++;
        continue;
      }

      // تمام عملیات بعد از رزرو قفل باید داخل این try/finally باشند.
      try {
        // مرحله دوم: استعلام از درگاه خارج از تراکنش
        let paymentStatus: "PAID" | "UNKNOWN" | "REVIEW" = "UNKNOWN";
        let paymentRefId: string | null = null;

        // پرداخت آزمایشی
        if (
          process.env.PAYMENT_MODE !== "zarinpal" &&
          process.env.NODE_ENV !== "production" &&
          snapshot.authority.startsWith("MOCK-")
        ) {
          paymentStatus = "REVIEW";
        } else {
          const inquiry = await inquiryPayment(snapshot.authority);

          if (inquiry === "VERIFIED" || inquiry === "PAID") {
            const verification = await verifyPayment(
              snapshot.authority,
              snapshot.amount,
            );

            if (verification.status === "PAID") {
              paymentStatus = "PAID";
              paymentRefId = verification.refId;
            }
          } else if (inquiry === "FAILED" || inquiry === "REVERSED") {
            paymentStatus = "REVIEW";
          }
        }

        // نتیجه نامشخص
        if (paymentStatus === "UNKNOWN") {
          const updateResult = await withOrderLock(
            snapshot.orderId,
            async (tx) => {
              return tx.payment.updateMany({
                where: {
                  id: snapshot.paymentId,
                  orderId: snapshot.orderId,
                  authority: snapshot.authority,
                  inquiryStartedAt: claimedAt,
                  status: {
                    in: ["PENDING", "UNKNOWN"],
                  },
                },
                data: {
                  status: "UNKNOWN",
                  lastCheckedAt: new Date(),
                },
              });
            },
          );

          if (updateResult.count === 1) {
            pendingCount++;
          } else {
            console.warn(
              `[PAYMENT SKIPPED] Inquiry ownership lost: ${snapshot.orderId}`,
            );
          }

          continue;
        }

        // نیازمند بررسی
        if (paymentStatus === "REVIEW") {
          const updateResult = await withOrderLock(
            snapshot.orderId,
            async (tx) => {
              return tx.payment.updateMany({
                where: {
                  id: snapshot.paymentId,
                  orderId: snapshot.orderId,
                  authority: snapshot.authority,
                  inquiryStartedAt: claimedAt,
                  status: {
                    in: ["PENDING", "UNKNOWN"],
                  },
                },
                data: {
                  status: "REVIEW",
                  lastCheckedAt: new Date(),
                  failureMessage:
                    "وضعیت پرداخت از طریق استعلام نیازمند بررسی است",
                },
              });
            },
          );

          if (updateResult.count === 1) {
            console.warn(
              `[PAYMENT REVIEW] Payment requires investigation: ${snapshot.orderId}`,
            );

            reviewCount++;
          }

          continue;
        }

        // مرحله سوم: ثبت پرداخت موفق با قفل مشترک
        const result = await withOrderLock(snapshot.orderId, async (tx) => {
          const currentPayment = await tx.payment.findUnique({
            where: {
              id: snapshot.paymentId,
            },
            include: {
              Order: true,
            },
          });

          if (
            !currentPayment ||
            currentPayment.authority !== snapshot.authority
          ) {
            return "SKIPPED" as const;
          }

          // بررسی مالکیت قفل استعلام
          if (
            !currentPayment.inquiryStartedAt ||
            currentPayment.inquiryStartedAt.getTime() !== claimedAt.getTime()
          ) {
            return "SKIPPED" as const;
          }

          const currentOrder = currentPayment.Order;

          // جلوگیری از ثبت دوباره پرداخت
          if (currentPayment.status === "PAID") {
            return currentOrder.status === "PAID"
              ? ("PAID" as const)
              : ("REVIEW" as const);
          }

          if (currentPayment.status === "PAID_REVIEW") {
            return "REVIEW" as const;
          }

          if (!["PENDING", "UNKNOWN"].includes(currentPayment.status)) {
            return "SKIPPED" as const;
          }

          // پرداخت موفق برای سفارش لغوشده
          if (currentOrder.status === "CANCELED") {
            await tx.payment.update({
              where: {
                id: currentPayment.id,
              },
              data: {
                refId: paymentRefId,
                status: "PAID_REVIEW",
                verifiedAt: new Date(),
                lastCheckedAt: new Date(),
                failureMessage: "پرداخت موفق برای سفارش لغوشده؛ نیازمند بررسی",
              },
            });

            return "REVIEW" as const;
          }

          // بررسی مجدد اطلاعات سفارش
          if (
            currentOrder.status !== "PENDING" ||
            currentOrder.authority !== snapshot.authority ||
            currentOrder.createdAt >= expiresBefore ||
            currentPayment.amount !== currentOrder.total
          ) {
            await tx.payment.update({
              where: {
                id: currentPayment.id,
              },
              data: {
                status: "PAID_REVIEW",
                refId: paymentRefId,
                verifiedAt: new Date(),
                lastCheckedAt: new Date(),
                failureMessage:
                  "پرداخت موفق بوده اما وضعیت سفارش نیازمند بررسی است",
              },
            });

            return "REVIEW" as const;
          }

          // ثبت موفقیت پرداخت
          await tx.order.update({
            where: {
              id: currentOrder.id,
            },
            data: {
              status: "PAID",
            },
          });

          await tx.payment.update({
            where: {
              id: currentPayment.id,
            },
            data: {
              status: "PAID",
              refId: paymentRefId,
              verifiedAt: new Date(),
              lastCheckedAt: new Date(),
              failureCode: null,
              failureMessage: null,
            },
          });

          return "PAID" as const;
        });

        if (result === "PAID") {
          paidCount++;
        } else if (result === "REVIEW") {
          reviewCount++;
        }
      } finally {
        // آزادسازی قفل حتی در صورت خطا یا اجرای continue
        try {
          await releaseInquiryLock(
            snapshot.orderId,
            snapshot.paymentId,
            snapshot.authority,
            claimedAt,
          );
        } catch (error) {
          console.error(
            `Failed to release inquiry lock for order ${snapshot.orderId}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error(`Expire order ${order.id} failed:`, error);
      pendingCount++;
    }
  }

  return {
    expiredCount,
    paidCount,
    pendingCount,
    reviewCount,
  };
}
