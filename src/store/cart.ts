import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectedOption = {
  name: string;
  value: string;
};

type Item = {
  id: string;
  kind: "product" | "sim";
  title: string;
  price: number;
  qty: number;
  variantId?: string;
  selectedOptions?: SelectedOption[];
  cartItemId: string;
};

export const getCartItemId = (item: {
  id: string;
  kind: "product" | "sim";
  variantId?: string;
}) => {
  return `${item.kind}-${item.id}-${item.variantId ?? "default"}`;
};

type CartState = {
  items: Item[];
  add: (i: Omit<Item, "cartItemId">) => void;
  remove: (cartItemId: string) => void;
  setQty: (cartItemId: string, qty: number) => void;
  clear: () => void;
  total: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (i) =>
        set((s) => {
          const cartItemId = getCartItemId(i);

          const existingItem = s.items.find(
            (item) => (item.cartItemId || getCartItemId(item)) === cartItemId,
          );

          if (existingItem && i.kind === "product") {
            return {
              items: s.items.map((item) =>
                (item.cartItemId || getCartItemId(item)) === cartItemId
                  ? { ...item, qty: item.qty + 1 }
                  : item,
              ),
            };
          }

          if (existingItem) return s;

          return {
            items: [
              ...s.items,
              {
                ...i,
                cartItemId,
              },
            ],
          };
        }),

      remove: (cartItemId) =>
        set((s) => ({
          items: s.items.filter(
            (item) => (item.cartItemId || getCartItemId(item)) !== cartItemId,
          ),
        })),

      setQty: (cartItemId, qty) =>
        set((s) => ({
          items: s.items.map((item) =>
            (item.cartItemId || getCartItemId(item)) === cartItemId &&
            item.kind === "product"
              ? {
                  ...item,
                  qty: Math.max(1, Math.min(qty, 10)),
                }
              : item,
          ),
        })),

      clear: () => set({ items: [] }),

      total: () =>
        get().items.reduce((total, item) => total + item.price * item.qty, 0),
    }),
    {
      name: "teknolife-cart",
      version: 2,
    },
  ),
);
