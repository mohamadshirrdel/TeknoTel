import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { prisma } from "@/lib/prisma";
import ProductForm, {
  type InitialProduct,
} from "@/components/admin/ProductForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [categories, product] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    }),

    prisma.product.findUnique({
      where: { id },
      include: {
        ProductOption: {
          orderBy: { position: "asc" },
          include: {
            ProductOptionValue: {
              orderBy: { position: "asc" },
            },
          },
        },

        ProductVariant: {
          include: {
            VariantOptionValue: {
              include: {
                ProductOptionValue: {
                  include: {
                    ProductOption: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!product) notFound();

  const initialProduct: InitialProduct = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: product.price,
    discount: product.discount,
    stock: product.stock,
    brand: product.brand,
    categoryId: product.categoryId,
    images: product.images,
    colors: product.colors,

    filterValues:
      product.filterValues &&
      typeof product.filterValues === "object" &&
      !Array.isArray(product.filterValues)
        ? (product.filterValues as Record<string, string>)
        : {},

    customFields:
      product.customFields &&
      typeof product.customFields === "object" &&
      !Array.isArray(product.customFields)
        ? (product.customFields as Record<string, string>)
        : {},

    options: product.ProductOption.map((option) => ({
      name: option.name,
      values: option.ProductOptionValue.map((value) => value.value),
    })),

    variants: product.ProductVariant.map((variant) => ({
      selections: variant.VariantOptionValue.map((relation) => ({
        optionName: relation.ProductOptionValue.ProductOption.name,
        value: relation.ProductOptionValue.value,
      })),

      price: variant.price,
      discount: variant.discount,
      stock: variant.stock,
      isActive: variant.isActive,
    })),
  };

  return (
    <div className="space-y-6">
      {/* سربرگ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Package className="size-6" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-black text-ink sm:text-2xl">
              ویرایش محصول
            </h1>

            <p className="mt-1 truncate text-sm text-muted">{product.title}</p>
          </div>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <ArrowRight className="size-4" />
          بازگشت به محصولات
        </Link>
      </div>

      {/* فرم ویرایش */}
      <ProductForm categories={categories} initialProduct={initialProduct} />
    </div>
  );
}
