const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);
const isMock = (process.env.PAYMENT_MODE ?? "mock") !== "zarinpal";
const isSandbox = process.env.ZARINPAL_SANDBOX === "true";

const api = isSandbox
  ? "https://sandbox.zarinpal.com"
  : "https://payment.zarinpal.com";

const paymentPage = isSandbox
  ? "https://sandbox.zarinpal.com/pg/StartPay/"
  : "https://www.zarinpal.com/pg/StartPay/";

const TIMEOUT = 10_000;
const zp = process.env.ZARINPAL_MERCHANT_ID;

function validatePaymentAmount(toman: number) {
  if (!Number.isSafeInteger(toman) || toman <= 0) {
    throw new PaymentStartError("مبلغ سفارش نامعتبر است", false);
  }

  const rial = toman * 10;

  if (!Number.isSafeInteger(rial)) {
    throw new PaymentStartError("مبلغ پرداخت نامعتبر است", false);
  }

  return rial;
}

export type PaymentVerification =
  | {
      status: "PAID";
      refId: string | null;
    }
  | {
      status: "FAILED" | "UNKNOWN";
    };

export type PaymentInquiry =
  | "VERIFIED"
  | "PAID"
  | "IN_BANK"
  | "FAILED"
  | "REVERSED"
  | "UNKNOWN";

export class PaymentStartError extends Error {
  constructor(
    message: string,
    public readonly safeToRetry: boolean,
  ) {
    super(message);
    this.name = "PaymentStartError";
  }
}

export async function startPayment(order: { id: string; total: number }) {
  const amount = validatePaymentAmount(order.total);

  if (isMock) {
    if (process.env.NODE_ENV === "production") {
      throw new PaymentStartError(
        "پرداخت آزمایشی در محیط Production مجاز نیست",
        true,
      );
    }

    const authority = `MOCK-${order.id}`;

    return {
      authority,
      paymentUrl: `${APP_URL}/payment/mock?authority=${authority}`,
    };
  }

  if (!zp) {
    throw new PaymentStartError("ZARINPAL_MERCHANT_ID تنظیم نشده است", true);
  }

  try {
    const response = await fetch(`${api}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_id: zp,
        amount,
        callback_url: `${APP_URL}/api/payment/verify`,
        description: `سفارش ${order.id}`,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`خطای ارتباط با درگاه: ${response.status}`);
    }

    const json = await response.json();

    const code = json?.data?.code;
    const authority = json?.data?.authority;

    if (code !== 100) {
      throw new PaymentStartError(
        json?.errors?.message ?? "درخواست پرداخت توسط درگاه پذیرفته نشد",
        false,
      );
    }

    if (!authority || typeof authority !== "string") {
      throw new PaymentStartError(
        "درگاه درخواست را پذیرفته اما Authority معتبر برنگردانده است",
        false,
      );
    }

    return {
      authority,
      paymentUrl: `${paymentPage}${encodeURIComponent(authority)}`,
    };
  } catch (error) {
    if (error instanceof PaymentStartError) {
      throw error;
    }

    throw new PaymentStartError(
      error instanceof Error && error.name === "TimeoutError"
        ? "زمان انتظار برای پاسخ درگاه به پایان رسید"
        : "ارتباط با درگاه قطع شد؛ نتیجه درخواست مشخص نیست",
      false,
    );
  }
}

export async function verifyPayment(
  authority: string,
  total: number,
): Promise<PaymentVerification> {
  if (
    isMock &&
    process.env.NODE_ENV !== "production" &&
    authority.startsWith("MOCK-")
  ) {
    return {
      status: "PAID",
      refId: null,
    };
  }

  if (!authority || typeof authority !== "string" || authority.length > 100) {
    return { status: "UNKNOWN" };
  }

  if (!Number.isSafeInteger(total) || total <= 0) {
    return { status: "UNKNOWN" };
  }

  if (!zp) {
    console.error("ZARINPAL_MERCHANT_ID تنظیم نشده است");

    return {
      status: "UNKNOWN",
    };
  }

  try {
    const response = await fetch(`${api}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_id: zp,
        amount: validatePaymentAmount(total),
        authority,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "خطا در ارتباط با درگاه برای تأیید پرداخت:",
        response.status,
      );

      return {
        status: "UNKNOWN",
      };
    }

    const json = await response.json();

    const code = json?.data?.code;

    if (code === 100 || code === 101) {
      const rawRefId = json?.data?.ref_id;

      return {
        status: "PAID",
        refId:
          rawRefId === undefined || rawRefId === null ? null : String(rawRefId),
      };
    }

    return {
      status: "UNKNOWN",
    };
  } catch (error) {
    console.error("Payment verification error:", error);

    return {
      status: "UNKNOWN",
    };
  }
}

export async function inquiryPayment(
  authority: string,
): Promise<PaymentInquiry> {
  if (
    isMock &&
    process.env.NODE_ENV !== "production" &&
    authority.startsWith("MOCK-")
  ) {
    return "UNKNOWN";
  }

  if (!zp) {
    console.error("ZARINPAL_MERCHANT_ID تنظیم نشده است");

    return "UNKNOWN";
  }

  try {
    const response = await fetch(`${api}/pg/v4/payment/inquiry.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_id: zp,
        authority,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "خطا در ارتباط با درگاه برای استعلام وضعیت پرداخت:",
        response.status,
      );

      return "UNKNOWN";
    }

    const json = await response.json();

    const status = json?.status ?? json?.data?.status;

    switch (status) {
      case "VERIFIED":
        return "VERIFIED";

      case "PAID":
        return "PAID";

      case "IN_BANK":
        return "IN_BANK";

      case "FAILED":
        return "FAILED";

      case "REVERSED":
        return "REVERSED";

      default:
        return "UNKNOWN";
    }
  } catch (error) {
    console.error("Payment inquiry error:", error);

    return "UNKNOWN";
  }
}

export function getPaymentUrl(authority: string) {
  if (authority.startsWith("MOCK-")) {
    return `${APP_URL}/payment/mock?authority=${authority}`;
  }

  return `${paymentPage}${encodeURIComponent(authority)}`;
}
