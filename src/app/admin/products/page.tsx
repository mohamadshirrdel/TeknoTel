
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteProduct } from "@/actions/product";
import ProductForm from "@/components/admin/ProductForm";
import { Package, Pencil, Trash2 } from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

export default async function AdminProducts() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    }),

    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Category: {
          select: { name: true },
        },
        _count: {
          select: { OrderItem: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Package className="size-6" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-ink">
            محصولات
          </h1>

          <p className="mt-1 text-sm text-muted">
            مدیریت محصولات فروشگاه
          </p>
        </div>
      </div>

      {/* Product Form */}
      <ProductForm categories={categories} />

      {/* Products Table */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
          <h2 className="font-bold text-ink">
            فهرست محصولات
          </h2>

          <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
            {fa(products.length)} محصول
          </span>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Package className="size-7" />
            </div>

            <p className="mt-4 font-bold text-ink">
              هنوز محصولی ثبت نشده است.
            </p>

            <p className="mt-2 text-sm text-muted">
              از فرم بالا برای افزودن اولین محصول استفاده کن.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="border-b border-border bg-surface text-muted">
                <tr>
                  <th className="px-4 py-4 font-semibold">عنوان</th>
                  <th className="px-4 py-4 font-semibold">دسته</th>
                  <th className="px-4 py-4 font-semibold">قیمت</th>
                  <th className="px-4 py-4 font-semibold">تخفیف</th>
                  <th className="px-4 py-4 font-semibold">موجودی</th>
                  <th className="px-4 py-4 font-semibold">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border text-ink transition-colors last:border-0 hover:bg-surface/70"
                  >
                    <td className="max-w-xs px-4 py-4">
                      <span className="line-clamp-1 font-semibold">
                        {product.title}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-muted">
                      {product.Category.name}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-semibold">
                      {fa(product.price)}
                      <span className="mr-1 text-xs font-normal text-muted">
                        تومان
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {product.discount ? (
                        <span className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-bold text-green-600 dark:text-green-400">
                          {fa(product.discount)}٪
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={
                          product.stock === 0
                            ? "font-bold text-red-500"
                            : product.stock <= 5
                              ? "font-bold text-orange-500"
                              : "text-ink"
                        }
                      >
                        {fa(product.stock)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 transition-colors hover:text-blue-600"
                        >
                          <Pencil className="size-3.5" />
                          ویرایش
                        </Link>

                        {product._count.OrderItem > 0 ? (
                          <span className="whitespace-nowrap text-xs text-muted">
                            دارای سفارش
                          </span>
                        ) : (
                          <form action={deleteProduct.bind(null, product.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 transition-colors hover:text-red-600"
                            >
                              <Trash2 className="size-3.5" />
                              حذف
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
