"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { toEn } from "@/lib/digits";
import type { FormState } from "@/actions/product";
import { restoreOrderItems } from "@/lib/restore-order-items";
import { withOrderLock } from "@/lib/order-lock";
import { generateId } from "@/lib/id";

/* ---------- سفارش‌ها ---------- */

const statusSchema = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
]);

export async function updateOrderStatus(
  id: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  const status = parsed.data;

  const result = await withOrderLock(id, async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: {
        OrderItem: true,
        Payment: true,
      },
    });

    if (!order || order.status === status || order.status === "CANCELED") {
      return "SKIPPED" as const;
    }

    if (status === "CANCELED") {
      if (order.authority || order.paymentRequestedAt) {
        return "PAYMENT_REVIEW" as const;
      }

      const hasUnresolvedPayment = order.Payment.some(
        (payment) => payment.status !== "FAILED",
      );
      if (hasUnresolvedPayment) {
        return "PAYMENT_REVIEW" as const;
      }

      if (order.status !== "PENDING") {
        return "INVALID_TRANSITION" as const;
      }

      const canceled = await tx.order.updateMany({
        where: {
          id,
          status: "PENDING",
          authority: null,
          paymentRequestedAt: null,
        },
        data: {
          status: "CANCELED",
        },
      });

      if (canceled.count !== 1) {
        return "SKIPPED" as const;
      }

      await restoreOrderItems(tx, order.OrderItem);

      return "CANCELED" as const;
    }

    const allowedTransitions: Record<string, string[]> = {
      PENDING: [],
      PAID: ["PROCESSING"],
      PROCESSING: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: [],
      CANCELED: [],
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      return "INVALID_TRANSITION" as const;
    }

    if (status === "PROCESSING" && order.status !== "PAID") {
      return "INVALID_TRANSITION" as const;
    }

    await tx.order.update({
      where: { id },
      data: { status },
    });

    return "UPDATED" as const;
  });

  if (result === "CANCELED" || result === "UPDATED") {
    revalidatePath("/admin/orders");
    revalidatePath("/dashboard/orders");
  }

  if (result === "PAYMENT_REVIEW") {
    console.warn(
      `[ADMIN] Order cancellation blocked due to unresolved payment: ${id}`,
    );
  }
}

/* ---------- دسته‌بندی‌ها ---------- */

const categorySchema = z.object({
  name: z.string().trim().min(2, "نام دسته را وارد کنید"),

  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "اسلاگ فقط حروف انگلیسی کوچک، عدد و خط تیره",
    ),

  parentId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
});

export async function createCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است",
    };
  }

  const { parentId, ...categoryData } = parsed.data;

  try {
    // بررسی وجود دسته والد
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
        select: { id: true },
      });

      if (!parent) {
        return {
          ok: false,
          error: "دسته والد انتخاب‌شده معتبر نیست",
        };
      }
    }

    await prisma.category.create({
      data: {
        id: generateId(),
        ...categoryData,
        parentId,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { ok: false, error: "این اسلاگ قبلاً استفاده شده است" };
    }

    console.error("createCategory failed:", e);

    return { ok: false, error: "خطا در ذخیره‌ی دسته" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { ok: true };
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();

  // حذف فقط در صورتی انجام می‌شود که دسته محصول و زیر‌دسته نداشته باشد.
  const result = await prisma.category.deleteMany({
    where: {
      id,
      Product: {
        none: {},
      },
      other_Category: {
        none: {},
      },
    },
  });

  if (result.count > 0) {
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
  }
}

/* ---------- سیم‌کارت‌ها ---------- */

const simSchema = z.object({
  number: z
    .string()
    .regex(/^0912\d{7}$/, "شماره باید با 0912 شروع شود و ۱۱ رقم باشد"),

  price: z.coerce.number().int().min(1000, "قیمت نامعتبر است"),

  type: z.enum(["عادی", "رند", "طلایی"], {
    message: "نوع شماره را انتخاب کنید",
  }),
});

export async function createSim(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData) as Record<string, string>;

  const parsed = simSchema.safeParse({
    ...raw,
    number: toEn(raw.number ?? "").trim(),
    price: toEn(raw.price ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است",
    };
  }

  try {
    await prisma.simNumber.create({
      data: {
        id: generateId(),
        ...parsed.data,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { ok: false, error: "این شماره قبلاً ثبت شده است" };
    }

    console.error("createSim failed:", e);

    return { ok: false, error: "خطا در ذخیره‌ی شماره" };
  }

  revalidatePath("/admin/numbers");
  revalidatePath("/numbers");

  return { ok: true };
}

export async function deleteSim(id: string): Promise<void> {
  await requireAdmin();

  const used = await prisma.orderItem.count({
    where: { simId: id },
  });

  if (used > 0) return;

  await prisma.simNumber.delete({
    where: { id },
  });

  revalidatePath("/admin/numbers");
  revalidatePath("/numbers");
}
