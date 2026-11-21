import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/uploads";

export const runtime = "nodejs";

const NAME = /^[0-9a-f-]{36}\.webp$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;

    if (!NAME.test(name)) {
      return new Response("Not found", { status: 404 });
    }

    const filePath = path.join(UPLOAD_DIR, name);
    const file = await readFile(filePath);

    return new Response(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
