"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { toEn } from "@/lib/digits";

export type LinkResult = { ok: true } | { ok: false; error: string };

const TAKEN =
  "این شماره قبلاً برای حساب دیگری ثبت شده است. با همان شماره وارد شوید.";

export async function linkPhone(
  phoneInput: string,
  codeInput: string,
): Promise<LinkResult> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { ok: false, error: "ابتدا وارد حساب خود شوید" };

  const phone = toEn(phoneInput).trim();
  const code = toEn(codeInput).trim();
  if (!/^09\d{9}$/.test(phone)) {
    return { ok: false, error: "شماره نامعتبر است" };
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  if (!me) return { ok: false, error: "حساب پیدا نشد" };
  if (me.phone) return { ok: true }; // قبلاً ثبت شده

  // شماره‌ی حساب دیگر را نمی‌توان گرفت
  const taken = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });
  if (taken && taken.id !== userId) return { ok: false, error: TAKEN };

  // مالکیت شماره باید با کد پیامکی ثابت شود
  if (!(await verifyOtp(phone, code))) {
    return { ok: false, error: "کد اشتباه یا منقضی شده است" };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { phone } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { ok: false, error: TAKEN };
    }
    console.error("linkPhone failed:", e);
    return { ok: false, error: "خطا در ذخیره‌ی شماره" };
  }

  return { ok: true };
}
