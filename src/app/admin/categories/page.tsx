import { prisma } from "@/lib/prisma";
import { deleteCategory } from "@/actions/admin";
import CategoryForm from "@/components/admin/CategoryForm";
import { Folder, FolderTree, Trash2 } from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

export default async function AdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      _count: {
        select: {
          Product: true,
          other_Category: true,
        },
      },
    },
  });

  // ساخت ساختار درختی دسته‌بندی‌ها
  const tree: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
    productCount: number;
    childrenCount: number;
  }[] = [];

  const addChildren = (parentId: string | null, depth: number) => {
    const children = categories
      .filter((category) => category.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, "fa"));

    for (const category of children) {
      tree.push({
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        depth,
        productCount: category._count.Product,
        childrenCount: category._count.other_Category,
      });

      addChildren(category.id, depth + 1);
    }
  };

  addChildren(null, 0);

  return (
    <div className="space-y-6">
      {/* عنوان صفحه */}
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
          <FolderTree className="size-6" />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-black text-ink sm:text-2xl">
            مدیریت دسته‌بندی‌ها
          </h1>

          <p className="mt-1 text-xs text-muted sm:text-sm">
            مدیریت دسته‌های اصلی و زیر‌دسته‌های محصولات
          </p>
        </div>
      </div>

      {/* فرم افزودن دسته */}
      <CategoryForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          parentId: category.parentId,
        }))}
      />

      {/* فهرست دسته‌ها */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="font-bold text-ink">فهرست دسته‌بندی‌ها</h2>

            <p className="mt-1 text-xs text-muted">
              {fa(categories.length)} دسته ثبت شده
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2 text-xs font-bold text-brand">
            <FolderTree className="size-4" />
            ساختار درختی
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-surface text-muted">
              <FolderTree className="size-9" />
            </div>

            <p className="font-bold text-ink">هنوز دسته‌بندی‌ای ثبت نشده است</p>

            <p className="mt-2 text-sm text-muted">
              اولین دسته‌بندی خودت رو از فرم بالا ایجاد کن.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="border-b border-border bg-surface text-muted">
                <tr>
                  <th className="p-4 font-semibold">نام دسته‌بندی</th>
                  <th className="p-4 font-semibold">اسلاگ</th>
                  <th className="p-4 font-semibold">محصولات مستقیم</th>
                  <th className="p-4 font-semibold">زیر‌دسته‌ها</th>
                  <th className="p-4 text-center font-semibold">عملیات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {tree.map((category) => {
                  const canDelete =
                    category.productCount === 0 && category.childrenCount === 0;

                  return (
                    <tr
                      key={category.id}
                      className="transition-colors hover:bg-surface/70"
                    >
                      <td className="p-4">
                        <div
                          className="flex min-w-0 items-center gap-2"
                          style={{
                            paddingRight: `${category.depth * 26}px`,
                          }}
                        >
                          <Folder
                            className={`size-5 shrink-0 ${
                              category.depth === 0 ? "text-brand" : "text-muted"
                            }`}
                          />

                          <span
                            className={
                              category.depth === 0
                                ? "font-bold text-ink"
                                : "text-muted"
                            }
                          >
                            {category.name}
                          </span>

                          {category.depth === 0 && (
                            <span className="shrink-0 rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                              اصلی
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-muted" dir="ltr">
                        {category.slug}
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-ink">
                          {fa(category.productCount)}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex rounded-lg bg-surface px-2.5 py-1 text-xs text-muted">
                          {fa(category.childrenCount)}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {canDelete ? (
                          <form action={deleteCategory.bind(null, category.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                            >
                              <Trash2 className="size-3.5" />
                              حذف
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-muted">
                            غیرقابل حذف
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
