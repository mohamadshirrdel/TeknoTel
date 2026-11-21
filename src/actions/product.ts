"use server";

import { generateId } from "@/lib/id";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { toEn } from "@/lib/digits";
import { COLORS, MAX_IMAGES } from "@/lib/product-options";

export type FormState = {
  ok: boolean;
  error?: string;
};

const baseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "عنوان کوتاه است")
    .max(200, "عنوان بیش از حد طولانی است"),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "اسلاگ فقط حروف انگلیسی کوچک، عدد و خط تیره",
    ),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  brand: z.string().trim().max(100).optional(),
  description: z.string().trim().max(10000).optional(),
  price: z.coerce
    .number()
    .int()
    .min(1000, "قیمت نامعتبر است")
    .max(Number.MAX_SAFE_INTEGER),
  discount: z.coerce.number().int().min(0).max(90, "تخفیف بین ۰ تا ۹۰ باشد"),
  stock: z.coerce
    .number()
    .int()
    .min(0, "موجودی نامعتبر است")
    .max(Number.MAX_SAFE_INTEGER),
});

const pairSchema = z
  .array(
    z.object({
      key: z.string().trim().max(100),
      value: z.string().trim().max(500),
    }),
  )
  .max(50);

const COLOR_KEYS = new Set<string>(COLORS.map((color) => color.key));

const IMAGE_URL = /^\/uploads\/[0-9a-f-]{36}\.webp$/i;

const variantsSchema = z.object({
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        values: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
      }),
    )
    .max(10),

  variants: z
    .array(
      z.object({
        selections: z.array(
          z.object({
            optionName: z.string().trim().min(1),
            value: z.string().trim().min(1),
          }),
        ),
        price: z
          .number()
          .int()
          .min(1000, "قیمت هر ترکیب باید حداقل ۱۰۰۰ تومان باشد"),
        discount: z.number().int().min(0).max(90),
        stock: z.number().int().min(0),
        isActive: z.boolean(),
      }),
    )
    .max(250),
});

type ParsedVariants = z.infer<typeof variantsSchema>;

function parseDynamicFields(
  value: FormDataEntryValue | null,
): Record<string, string> | null {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    const result = pairSchema.safeParse(parsed);

    if (!result.success) return null;

    const fields = result.data.filter(
      (item) => item.key !== "" || item.value !== "",
    );

    if (fields.some((item) => !item.key || !item.value)) {
      return null;
    }

    const keys = fields.map((item) => item.key);

    if (new Set(keys).size !== keys.length) {
      return null;
    }

    return Object.fromEntries(fields.map(({ key, value }) => [key, value]));
  } catch {
    return null;
  }
}

function parseVariants(
  value: FormDataEntryValue | null,
): ParsedVariants | null {
  try {
    const raw = JSON.parse(String(value ?? ""));

    if (!raw || typeof raw !== "object") return null;

    const options = Array.isArray(raw.options)
      ? raw.options.map((option: { name?: string; values?: string[] }) => ({
          ...option,
          values: Array.isArray(option.values)
            ? [...new Set(option.values.map((v) => String(v).trim()))]
            : [],
        }))
      : [];

    const variants = Array.isArray(raw.variants)
      ? raw.variants.map(
          (variant: {
            selections?: { optionName: string; value: string }[];
            price?: number;
            discount?: number;
            stock?: number;
            isActive?: boolean;
          }) => ({
            ...variant,
            price: Number(toEn(String(variant.price ?? ""))),
            discount: Number(toEn(String(variant.discount ?? ""))),
            stock: Number(toEn(String(variant.stock ?? ""))),
          }),
        )
      : [];

    const result = variantsSchema.safeParse({ options, variants });

    if (!result.success) return null;

    const parsed = result.data;

    // محصول بدون تنوع نیز مجاز است.
    if (parsed.options.length === 0) {
      return parsed.variants.length === 0 ? parsed : null;
    }

    // هر ویژگی باید نام و مقادیر یکتا داشته باشد.
    const optionNames = parsed.options.map((option) => option.name);

    if (new Set(optionNames).size !== optionNames.length) {
      return null;
    }

    for (const option of parsed.options) {
      if (new Set(option.values).size !== option.values.length) {
        return null;
      }
    }

    // تعداد ترکیب‌ها باید با حاصل‌ضرب مقادیر ویژگی‌ها برابر باشد.
    const expectedCount = parsed.options.reduce(
      (total, option) => total * option.values.length,
      1,
    );

    if (expectedCount > 250) {
      return null;
    }

    if (
      parsed.variants.length !== expectedCount ||
      parsed.variants.length === 0
    ) {
      return null;
    }

    const optionNameSet = new Set(optionNames);
    const combinationKeys = new Set<string>();

    for (const variant of parsed.variants) {
      if (variant.selections.length !== parsed.options.length) {
        return null;
      }

      const selectionNames = variant.selections.map(
        (selection) => selection.optionName,
      );

      if (
        new Set(selectionNames).size !== selectionNames.length ||
        !selectionNames.every((name) => optionNameSet.has(name))
      ) {
        return null;
      }

      for (const selection of variant.selections) {
        const option = parsed.options.find(
          (item) => item.name === selection.optionName,
        );

        if (!option?.values.includes(selection.value)) {
          return null;
        }
      }

      const orderedSelections = parsed.options.map((option) => {
        const selection = variant.selections.find(
          (item) => item.optionName === option.name,
        );

        return [option.name, selection?.value];
      });

      const key = JSON.stringify(orderedSelections);

      if (combinationKeys.has(key)) {
        return null;
      }

      combinationKeys.add(key);
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function createProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData) as Record<string, string>;

  const base = baseSchema.safeParse({
    ...raw,
    price: toEn(raw.price ?? ""),
    discount: toEn(raw.discount || "0"),
    stock: toEn(raw.stock ?? ""),
  });

  if (!base.success) {
    return {
      ok: false,
      error: base.error.issues[0]?.message ?? "اطلاعات محصول نامعتبر است",
    };
  }

  const filterValues = parseDynamicFields(formData.get("filterValues"));
  const customFields = parseDynamicFields(formData.get("customFields"));

  const colors = [...new Set(formData.getAll("colors").map(String))];

  if (
    filterValues === null ||
    customFields === null ||
    colors.length > COLORS.length ||
    !colors.every((key) => COLOR_KEYS.has(key))
  ) {
    return {
      ok: false,
      error: "ویژگی‌ها یا رنگ‌های محصول نامعتبر هستند",
    };
  }

  const variantsData = parseVariants(formData.get("variantsData"));

  if (variantsData === null) {
    return {
      ok: false,
      error: "اطلاعات تنوع‌ها یا ترکیب‌های محصول نامعتبر است",
    };
  }

  const images = [...new Set(formData.getAll("images").map(String))];

  if (images.length < 1) {
    return { ok: false, error: "حداقل یک عکس آپلود کنید" };
  }

  if (images.length > MAX_IMAGES) {
    return {
      ok: false,
      error: `حداکثر ${MAX_IMAGES} عکس مجاز است`,
    };
  }

  if (!images.every((url) => IMAGE_URL.test(url))) {
    return { ok: false, error: "آدرس عکس‌ها نامعتبر است" };
  }

  const d = base.data;

  const category = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });

  if (!category) {
    return {
      ok: false,
      error: "دسته‌بندی انتخاب‌شده معتبر نیست",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // ۱. ثبت محصول اصلی
      const product = await tx.product.create({
        data: {
          id: generateId(),
          title: d.title,
          slug: d.slug,
          categoryId: d.categoryId,
          brand: d.brand || null,
          description: d.description || null,
          price: d.price,
          discount: d.discount,
          stock: d.stock,
          images,
          colors,
          filterValues,
          customFields,
        },
      });

      // ۲. ثبت ویژگی‌ها و مقادیر آن‌ها
      // ۲. ثبت ویژگی‌ها و مقادیر آن‌ها
      const optionValueIds = new Map<string, string>();

      for (const [optionIndex, option] of variantsData.options.entries()) {
        const createdOption = await tx.productOption.create({
          data: {
            id: generateId(),
            productId: product.id,
            name: option.name,
            position: optionIndex,
            ProductOptionValue: {
              create: option.values.map((value, valueIndex) => ({
                id: generateId(),
                value,
                label: value,
                position: valueIndex,
              })),
            },
          },
          include: {
            ProductOptionValue: true,
          },
        });

        for (const optionValue of createdOption.ProductOptionValue) {
          optionValueIds.set(
            JSON.stringify([option.name, optionValue.value]),
            optionValue.id,
          );
        }
      }

      // ۳. ثبت ترکیب‌ها و اتصال مقادیر ویژگی‌ها
      for (const variant of variantsData.variants) {
        const orderedSelections = variantsData.options.map((option) => {
          const selection = variant.selections.find(
            (item) => item.optionName === option.name,
          );

          return [option.name, selection!.value];
        });

        const combinationKey = JSON.stringify(orderedSelections);

        const selectedValueIds = orderedSelections.map((selection) => {
          const id = optionValueIds.get(JSON.stringify(selection));

          if (!id) {
            throw new Error("مقدار ویژگی پیدا نشد");
          }

          return id;
        });

        await tx.productVariant.create({
          data: {
            id: generateId(),
            updatedAt: new Date(),
            productId: product.id,
            combinationKey,
            price: variant.price,
            discount: variant.discount,
            stock: variant.stock,
            isActive: variant.isActive,
            VariantOptionValue: {
              create: selectedValueIds.map((optionValueId) => ({
                id: generateId(),
                ProductOptionValue: {
                  connect: { id: optionValueId },
                },
              })),
            },
          },
        });
      }
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        ok: false,
        error: "این اسلاگ یا یکی از اطلاعات محصول قبلاً ثبت شده است",
      };
    }

    console.error("createProduct failed:", error);

    return {
      ok: false,
      error: "خطا در ذخیره‌ی محصول",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");

  return { ok: true };
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();

  if (!id || typeof id !== "string") return;

  try {
    await prisma.$transaction(async (tx) => {
      const used = await tx.orderItem.count({
        where: { productId: id },
      });

      if (used > 0) return;

      await tx.product.delete({
        where: { id },
      });
    });
  } catch (error) {
    console.error("deleteProduct failed:", error);
    return;
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProduct(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  if (!id || typeof id !== "string") {
    return { ok: false, error: "شناسه محصول نامعتبر است" };
  }

  const raw = Object.fromEntries(formData) as Record<string, string>;

  const base = baseSchema.safeParse({
    ...raw,
    price: toEn(raw.price ?? ""),
    discount: toEn(raw.discount || "0"),
    stock: toEn(raw.stock ?? ""),
  });

  if (!base.success) {
    return {
      ok: false,
      error: base.error.issues[0]?.message ?? "اطلاعات محصول نامعتبر است",
    };
  }

  const filterValues = parseDynamicFields(formData.get("filterValues"));
  const customFields = parseDynamicFields(formData.get("customFields"));
  const colors = [...new Set(formData.getAll("colors").map(String))];

  if (
    filterValues === null ||
    customFields === null ||
    colors.length > COLORS.length ||
    !colors.every((key) => COLOR_KEYS.has(key))
  ) {
    return {
      ok: false,
      error: "ویژگی‌ها یا رنگ‌های محصول نامعتبر هستند",
    };
  }

  const variantsData = parseVariants(formData.get("variantsData"));

  if (!variantsData) {
    return {
      ok: false,
      error: "اطلاعات تنوع‌ها یا ترکیب‌های محصول نامعتبر است",
    };
  }

  const images = [...new Set(formData.getAll("images").map(String))];

  if (images.length < 1 || images.length > MAX_IMAGES) {
    return {
      ok: false,
      error: `تعداد تصاویر باید بین ۱ تا ${MAX_IMAGES} باشد`,
    };
  }

  if (!images.every((url) => IMAGE_URL.test(url))) {
    return {
      ok: false,
      error: "آدرس تصاویر نامعتبر است",
    };
  }

  const d = base.data;

  const category = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });

  if (!category) {
    return {
      ok: false,
      error: "دسته‌بندی انتخاب‌شده معتبر نیست",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: {
          ProductOption: {
            include: {
              ProductOptionValue: true,
            },
          },
          ProductVariant: {
            include: {
              VariantOptionValue: true,
              _count: {
                select: {
                  OrderItem: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      // 1. به‌روزرسانی اطلاعات اصلی محصول
      await tx.product.update({
        where: { id },
        data: {
          title: d.title,
          slug: d.slug,
          categoryId: d.categoryId,
          brand: d.brand || null,
          description: d.description || null,
          price: d.price,
          discount: d.discount,
          stock: d.stock,
          images,
          colors,
          filterValues,
          customFields,
        },
      });

      const oldOptions = product.ProductOption;
      const oldVariants = product.ProductVariant;

      // 2. نگهداری ID مقادیر ویژگی‌های موجود
      const oldOptionValueMap = new Map<string, string>();

      for (const option of oldOptions) {
        for (const value of option.ProductOptionValue) {
          oldOptionValueMap.set(
            JSON.stringify([option.name, value.value]),
            value.id,
          );
        }
      }

      // 3. شناسایی واریانت‌های قبلی
      const oldVariantMap = new Map(
        oldVariants.map((variant) => [variant.combinationKey, variant]),
      );

      // 4. ساخت یا به‌روزرسانی ویژگی‌ها و مقادیر
      const optionValueIds = new Map<string, string>();
      const retainedOptionIds = new Set<string>();

      for (const [optionIndex, option] of variantsData.options.entries()) {
        const savedOption = await tx.productOption.upsert({
          where: {
            productId_name: {
              productId: id,
              name: option.name,
            },
          },
          create: {
            id: generateId(),
            productId: id,
            name: option.name,
            position: optionIndex,
          },
          update: {
            position: optionIndex,
          },
        });

        retainedOptionIds.add(savedOption.id);

        for (const [valueIndex, value] of option.values.entries()) {
          const savedValue = await tx.productOptionValue.upsert({
            where: {
              optionId_value: {
                optionId: savedOption.id,
                value,
              },
            },
            create: {
              id: generateId(),
              optionId: savedOption.id,
              value,
              label: value,
              position: valueIndex,
            },
            update: {
              label: value,
              position: valueIndex,
            },
          });

          optionValueIds.set(
            JSON.stringify([option.name, value]),
            savedValue.id,
          );
        }
      }

      // 5. ایجاد یا به‌روزرسانی واریانت‌ها
      const retainedVariantIds = new Set<string>();

      for (const variant of variantsData.variants) {
        const orderedSelections = variantsData.options.map((option) => {
          const selection = variant.selections.find(
            (item) => item.optionName === option.name,
          );

          return [option.name, selection!.value];
        });

        const combinationKey = JSON.stringify(orderedSelections);

        const selectedValueIds = orderedSelections.map((selection) => {
          const valueId = optionValueIds.get(JSON.stringify(selection));

          if (!valueId) {
            throw new Error("OPTION_VALUE_NOT_FOUND");
          }

          return valueId;
        });

        const oldVariant = oldVariantMap.get(combinationKey);

        const savedVariant = oldVariant
          ? oldVariant._count.OrderItem > 0
            ? await tx.productVariant.update({
                where: { id: oldVariant.id },
                data: {
                  isActive: variant.isActive,
                  updatedAt: new Date(),
                },
              })
            : await tx.productVariant.update({
                where: { id: oldVariant.id },
                data: {
                  price: variant.price,
                  discount: variant.discount,
                  stock: variant.stock,
                  isActive: variant.isActive,
                  updatedAt: new Date(),
                },
              })
          : await tx.productVariant.create({
              data: {
                id: generateId(),
                updatedAt: new Date(),
                productId: id,
                combinationKey,
                price: variant.price,
                discount: variant.discount,
                stock: variant.stock,
                isActive: variant.isActive,
              },
            });
        retainedVariantIds.add(savedVariant.id);

        // 6. همگام‌سازی ارتباط واریانت با مقادیر ویژگی‌ها
        // 6. همگام‌سازی ارتباط واریانت با مقادیر ویژگی‌ها
        const existingRelations = await tx.variantOptionValue.findMany({
          where: { variantId: savedVariant.id },
        });

        // اگر واریانت قبلاً در سفارش استفاده شده، روابط آن را تغییر نمی‌دهیم
        if (oldVariant && oldVariant._count.OrderItem > 0) {
          // روابط این واریانت برای حفظ سابقه سفارش دست‌نخورده باقی می‌مانند
        } else {
          const existingRelationIds = new Set(
            existingRelations.map((relation) => relation.optionValueId),
          );

          // حذف ارتباط‌های قدیمی که دیگر انتخاب نشده‌اند
          const relationsToDelete = existingRelations.filter(
            (relation) => !selectedValueIds.includes(relation.optionValueId),
          );

          if (relationsToDelete.length > 0) {
            await tx.variantOptionValue.deleteMany({
              where: {
                variantId: savedVariant.id,
                optionValueId: {
                  in: relationsToDelete.map(
                    (relation) => relation.optionValueId,
                  ),
                },
              },
            });
          }

          // ایجاد ارتباط‌های جدید
          for (const optionValueId of selectedValueIds) {
            if (!existingRelationIds.has(optionValueId)) {
              await tx.variantOptionValue.create({
                data: {
                  id: generateId(),
                  variantId: savedVariant.id,
                  optionValueId,
                },
              });
            }
          }
        }
      }

      // 7. مدیریت واریانت‌های حذف‌شده از فرم
      for (const variant of oldVariants) {
        if (retainedVariantIds.has(variant.id)) continue;

        if (variant._count.OrderItem > 0) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              isActive: false,
              stock: 0,
            },
          });
        } else {
          await tx.productVariant.delete({
            where: { id: variant.id },
          });
        }
      }

      // 8. مدیریت ویژگی‌های قدیمی
      for (const option of oldOptions) {
        if (retainedOptionIds.has(option.id)) continue;

        const optionValues = await tx.productOptionValue.findMany({
          where: { optionId: option.id },
          select: { id: true },
        });

        const valueIds = optionValues.map((value) => value.id);

        const linkedVariants = valueIds.length
          ? await tx.variantOptionValue.findMany({
              where: {
                optionValueId: { in: valueIds },
              },
              select: { variantId: true },
            })
          : [];

        const linkedVariantIds = [
          ...new Set(linkedVariants.map((item) => item.variantId)),
        ];

        const usedByOrders = linkedVariantIds.length
          ? await tx.orderItem.count({
              where: {
                variantId: { in: linkedVariantIds },
              },
            })
          : 0;

        // اگر ویژگی در سفارش‌های قبلی استفاده شده باشد، حفظ می‌شود
        if (usedByOrders > 0) continue;

        await tx.productOption.delete({
          where: { id: option.id },
        });
      }
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        ok: false,
        error: "این اسلاگ قبلاً برای محصول دیگری ثبت شده است",
      };
    }

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return {
        ok: false,
        error: "محصول موردنظر پیدا نشد",
      };
    }

    console.error("updateProduct failed:", error);

    return {
      ok: false,
      error: "خطا در به‌روزرسانی محصول",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/product/${d.slug}`);

  return { ok: true };
}
