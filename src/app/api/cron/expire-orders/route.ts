import { NextResponse } from "next/server";
import { expirePendingOrders } from "@/lib/order-expiration";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET تنظیم نشده است" },
      { status: 500 },
    );
  }

  const authorization = req.headers.get("authorization");

  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const result = await expirePendingOrders();

    return NextResponse.json({
      ok: true,
      message: "بررسی سفارش‌های منقضی‌شده انجام شد",
      ...result,
    });
  } catch (error) {
    console.error("Expire orders failed:", error);

    return NextResponse.json(
      { error: "خطا در بررسی سفارش‌ها" },
      { status: 500 },
    );
  }
}
