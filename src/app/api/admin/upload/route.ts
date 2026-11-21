import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { auth } from "@/auth";
import { UPLOAD_DIR } from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = 9 * 1024 * 1024;
const MAX_PIXELS = 25_000_000;

const TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  try {
    // احراز هویت ادمین
    const session = await auth();
    const user = session?.user as { role?: string } | undefined;

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
    }

    // محدودیت حجم کل درخواست
    const contentLength = Number(req.headers.get("content-length") ?? 0);

    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "حجم درخواست بیش از حد مجاز است" },
        { status: 413 },
      );
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایلی ارسال نشد" }, { status: 400 });
    }

    if (!TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "فقط JPG، PNG یا WebP مجاز است" },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "فایل خالی است" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "حجم هر عکس حداکثر ۸ مگابایت است" },
        { status: 413 },
      );
    }

    const input = Buffer.from(await file.arrayBuffer());

    if (input.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "حجم فایل بیش از حد مجاز است" },
        { status: 413 },
      );
    }

    // پردازش و بازسازی واقعی تصویر
    const out = await sharp(input, {
      limitInputPixels: MAX_PIXELS,
      failOn: "error",
    })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    // نام امن و تصادفی
    const name = `${randomUUID()}.webp`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const filePath = path.join(UPLOAD_DIR, name);

    // ذخیره فایل
    await writeFile(filePath, out, { flag: "wx" });

    return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
    }

    console.error("Admin image upload error:", error);

    return NextResponse.json(
      { error: "خطا در پردازش یا ذخیره تصویر" },
      { status: 500 },
    );
  }
}
