import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/shop/ProductCard";
import { PackageSearch, ShoppingBag } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // دریافت دسته‌بندی و فهرست ارتباط والد و فرزندان
  const [category, allCategories] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.category.findMany({
      select: {
        id: true,
        parentId: true,
      },
    }),
  ]);

  if (!category) notFound();

  // پیدا کردن تمام زیر‌دسته‌ها، حتی در چند سطح
  const categoryIds = new Set<string>([category.id]);

  const addDescendants = (parentId: string) => {
    const children = allCategories.filter(
      (item) => item.parentId === parentId,
    );

    for (const child of children) {
      if (categoryIds.has(child.id)) continue;

      categoryIds.add(child.id);
      addDescendants(child.id);
    }
  };

  addDescendants(category.id);

  // دریافت محصولات دسته اصلی و تمام زیر‌دسته‌ها
  const products = await prisma.product.findMany({
    where: {
      categoryId: {
        in: Array.from(categoryIds),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const productCount = products.length;

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      {/* Category Header */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7 dark:border-gray-800 dark:bg-gray-900">
        <div className="absolute -left-12 -top-16 size-48 rounded-full bg-red-50 blur-3xl dark:bg-red-950/20" />

        <div className="relative flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-brand sm:size-16 dark:bg-red-950/40">
            <ShoppingBag className="size-7 sm:size-8" />
          </div>

          <div className="min-w-0">
            <span className="text-xs font-medium text-brand sm:text-sm">
              دسته‌بندی محصولات
            </span>

            <h1 className="mt-1 text-xl font-black text-gray-900 sm:text-2xl dark:text-white">
              {category.name}
            </h1>

            <p className="mt-2 text-xs text-gray-400 sm:text-sm dark:text-gray-500">
              محصولات این دسته‌بندی و زیر‌دسته‌های آن را مشاهده کنید.
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            تعداد محصولات
          </span>

          <span className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-bold text-brand dark:bg-red-950/40">
            {productCount.toLocaleString("fa-IR")} محصول
          </span>
        </div>
      </section>

      {/* Products */}
      {productCount === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-brand dark:bg-red-950/40">
            <PackageSearch className="size-8" />
          </div>

          <h2 className="font-bold text-gray-900 dark:text-white">
            هنوز محصولی در این دسته ثبت نشده است
          </h2>

          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            به‌زودی محصولات جدید به این دسته‌بندی اضافه می‌شوند.
          </p>
        </section>
      ) : (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 sm:text-xl dark:text-white">
              محصولات {category.name}
            </h2>

            <span className="text-xs text-gray-400 sm:text-sm dark:text-gray-500">
              جدیدترین محصولات
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                title={product.title}
                image={product.images[0] ?? "/placeholder.png"}
                price={product.price}
                discount={product.discount}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}