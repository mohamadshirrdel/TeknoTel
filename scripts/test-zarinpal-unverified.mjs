import { ZarinPal } from "zarinpal-node-sdk";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

async function main() {
  const envResult = loadEnvConfig(process.cwd());

  console.log(
    "Loaded env files:",
    envResult.loadedEnvFiles.map((file) => file.path),
  );

  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();

  if (!merchantId) {
    throw new Error("ZARINPAL_MERCHANT_ID خالی است.");
  }

  const sandbox = process.env.ZARINPAL_SANDBOX === "true";

  console.log("Merchant ID exists:", true);
  console.log("Merchant ID length:", merchantId.length);
  console.log("Sandbox:", sandbox);

  const zarinpal = new ZarinPal({
    merchantId,
    sandbox,
  });

  console.log("\nدر حال دریافت تراکنش‌های تأییدنشده...");

  const result = await zarinpal.unverified.list();

  console.log("\nپاسخ زرین‌پال:");

  console.dir(result, {
    depth: null,
    colors: true,
  });

  console.log("\nخروجی JSON:");

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("\nخطا در دریافت اطلاعات:");

  if (error.response) {
    console.log("HTTP Status:", error.response.status);

    console.log(
      "ZarinPal Error Details:",
      JSON.stringify(error.response.data, null, 2),
    );
  } else {
    console.error(error.message);
  }

  process.exitCode = 1;
});
