import type { Prisma } from "@/generated/prisma/client";

type OrderItemToRestore = {
  productId: string | null;
  variantId: string | null;
  simId: string | null;
  qty: number;
};

export async function restoreOrderItems(
  tx: Prisma.TransactionClient,
  items: OrderItemToRestore[],
): Promise<void> {
  for (const item of items) {
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      throw new Error(`Invalid order item quantity: ${item.qty}`);
    }

    if (item.variantId) {
      const restored = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
        },
        data: {
          stock: {
            increment: item.qty,
          },
        },
      });

      if (restored.count !== 1) {
        throw new Error(
          `Failed to restore stock for variant: ${item.variantId}`,
        );
      }
    } else if (item.productId) {
      const restored = await tx.product.updateMany({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            increment: item.qty,
          },
        },
      });

      if (restored.count !== 1) {
        throw new Error(
          `Failed to restore stock for product: ${item.productId}`,
        );
      }
    } else if (!item.simId) {
      throw new Error("Order item has no product, variant, or SIM reference");
    }

    if (item.simId) {
      const restored = await tx.simNumber.updateMany({
        where: {
          id: item.simId,
          sold: true,
        },
        data: {
          sold: false,
        },
      });

      if (restored.count !== 1) {
        throw new Error(`Failed to restore SIM availability: ${item.simId}`);
      }
    }
  }
}
