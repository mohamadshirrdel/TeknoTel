import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function withOrderLock<T>(
  orderId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`
        SELECT 1
        FROM (
          SELECT pg_advisory_xact_lock(
            hashtextextended(${orderId}, 0)
          )
        ) AS lock_result
      `;

      return callback(tx);
    },
    {
      maxWait: 10000,
      timeout: 30000,
    },
  );
}