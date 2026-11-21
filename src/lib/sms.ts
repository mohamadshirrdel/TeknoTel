export async function sendSms(phone: string, code: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[SMS-DEV] ${phone} => ${code}`);
    return;
  }
  // TODO: اتصال به پنل پیامک (کاوه‌نگار، ملی‌پیامک، ...)
  throw new Error("SMS provider not configured");
}
