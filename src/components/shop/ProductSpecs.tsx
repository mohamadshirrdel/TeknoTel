import { COLORS } from "@/lib/product-options";
import { Info, Palette, ListChecks } from "lucide-react";

type Props = {
  colors: string[];
  filterValues: unknown;
  customFields: unknown;
};

type SpecRow = [string, string];

const fa = (n: number) => n.toLocaleString("fa-IR");

function formatValue(value: unknown): string {
  if (typeof value === "number") {
    return fa(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "بله" : "خیر";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? JSON.stringify(item)
          : String(item),
      )
      .join("، ");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return "";
}

function getRows(data: unknown): SpecRow[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [];
  }

  return Object.entries(data)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    )
    .map(([key, value]): SpecRow => [key, formatValue(value)])
    .filter(([, value]) => value !== "");
}

export default function ProductSpecs({
  colors,
  filterValues,
  customFields,
}: Props) {
  const filterRows = getRows(filterValues);
  const customRows = getRows(customFields);

  const allRows = [...filterRows, ...customRows];

  const uniqueRows = Array.from(
    new Map(allRows.map(([key, value]) => [key, value])).entries(),
  );

  const availableColors = COLORS.filter((color) => colors.includes(color.key));

  if (!uniqueRows.length && !availableColors.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/70">
        <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <Info className="size-5" />
        </div>

        <div>
          <h2 className="font-black text-gray-900 dark:text-white">
            مشخصات محصول
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            اطلاعات و ویژگی‌های فنی محصول
          </p>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {/* Colors */}
        {availableColors.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Palette className="size-4 text-brand" />

              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                رنگ‌های موجود
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <div
                  key={color.key}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <span
                    className="size-4 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ background: color.hex }}
                  />

                  <span>{color.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications */}
        {uniqueRows.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="size-4 text-brand" />

              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                مشخصات فنی
              </h3>
            </div>

            <dl className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
              {uniqueRows.map(([key, value], index) => (
                <div
                  key={`${key}-${index}`}
                  className={`flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                    index % 2 === 0
                      ? "bg-gray-50 dark:bg-gray-800/60"
                      : "bg-white dark:bg-gray-900"
                  }`}
                >
                  <dt className="text-gray-500 dark:text-gray-400">{key}</dt>

                  <dd className="font-semibold text-gray-800 dark:text-gray-100 sm:text-left">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
