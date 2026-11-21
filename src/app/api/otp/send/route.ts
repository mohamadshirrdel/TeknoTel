import { generateId } from "@/lib/id";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/),
});

const OTP_EXPIRY_MINUTES = 2;
const MAX_REQUESTS = 3;
const RATE_LIMIT_MINUTES = 10;

export async function POST(req: Request) {
  try {
    // بررسی صحیح درخواست
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "شماره نامعتبر است" }, { status: 400 });
    }

    const { phone } = parsed.data;

    // محدودیت تعداد درخواست در بازه زمانی
    const since = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);

    const recentRequests = await prisma.otpCode.count({
      where: {
        phone,
        createdAt: { gte: since },
      },
    });

    if (recentRequests >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: "تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد تلاش کنید" },
        { status: 429 },
      );
    }

    // حذف کدهای قبلی این شماره
    await prisma.otpCode.deleteMany({
      where: { phone },
    });

    // تولید کد امن
    const code = String(randomInt(10000, 100000));

    const codeHash = await bcrypt.hash(code, 8);

    await prisma.otpCode.create({
      data: {
        id: generateId(),
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    try {
      await sendSms(phone, code);
    } catch (error) {
      // حذف کد در صورت شکست ارسال پیامک
      await prisma.otpCode.deleteMany({ where: { phone } });

      console.error("OTP SMS sending failed:", error);

      return NextResponse.json(
        { error: "ارسال پیامک ناموفق بود؛ دوباره تلاش کنید" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OTP request failed:", error);

    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
