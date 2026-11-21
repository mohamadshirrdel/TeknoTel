"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { TrendingUp } from "lucide-react";

type PaymentData = {
  date: string;
  amount: number;
};

type Period = "daily" | "weekly" | "monthly" | "yearly";

type Props = {
  payments: PaymentData[];
  now: string;
};

const TIME_ZONE = "Asia/Tehran";

const periods: { id: Period; label: string }[] = [
  { id: "daily", label: "روزانه" },
  { id: "weekly", label: "هفتگی" },
  { id: "monthly", label: "ماهانه" },
  { id: "yearly", label: "سالانه" },
];

const fa = (n: number) => n.toLocaleString("fa-IR");

function getTehranDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

function getDateKey(date: Date, period: Period) {
  const { year, month, day } = getTehranDate(date);

  if (period === "daily") {
    return `${year}-${month}-${day}`;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (period === "weekly") {
    // شروع هفته در ایران: شنبه
    const daysSinceSaturday = (utcDate.getUTCDay() + 1) % 7;

    utcDate.setUTCDate(utcDate.getUTCDate() - daysSinceSaturday);

    return `${utcDate.getUTCFullYear()}-${utcDate.getUTCMonth() + 1}-${utcDate.getUTCDate()}`;
  }

  if (period === "monthly") {
    return `${year}-${month}`;
  }

  return `${year}`;
}

function formatLabel(date: Date, period: Period) {
  const months = [
    "ژانویه",
    "فوریه",
    "مارس",
    "آوریل",
    "مه",
    "ژوئن",
    "ژوئیه",
    "اوت",
    "سپتامبر",
    "اکتبر",
    "نوامبر",
    "دسامبر",
  ];

  const weekdays = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ];

  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  if (period === "daily") {
    return weekdays[date.getUTCDay()];
  }

  if (period === "weekly") {
    return `${day.toLocaleString("fa-IR")} ${months[month]}`;
  }

  if (period === "monthly") {
    return months[month];
  }

  return year.toLocaleString("fa-IR");
}

function getLabels(period: Period, now: Date) {
  const labels: { key: string; label: string }[] = [];

  const { year, month, day } = getTehranDate(now);

  const currentDate = new Date(Date.UTC(year, month - 1, day));

  if (period === "daily") {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setUTCDate(date.getUTCDate() - i);

      labels.push({
        key: getDateKey(date, period),
        label: formatLabel(date, period),
      });
    }
  }

  if (period === "weekly") {
    const daysSinceSaturday = (currentDate.getUTCDay() + 1) % 7;

    for (let i = 7; i >= 0; i--) {
      const date = new Date(currentDate);

      date.setUTCDate(date.getUTCDate() - daysSinceSaturday - i * 7);

      labels.push({
        key: getDateKey(date, period),
        label: formatLabel(date, period),
      });
    }
  }

  if (period === "monthly") {
    for (let i = 11; i >= 0; i--) {
      const date = new Date(Date.UTC(year, month - 1 - i, 1));

      labels.push({
        key: getDateKey(date, period),
        label: formatLabel(date, period),
      });
    }
  }

  if (period === "yearly") {
    for (let i = 4; i >= 0; i--) {
      const date = new Date(Date.UTC(year - i, 0, 1));

      labels.push({
        key: getDateKey(date, period),
        label: formatLabel(date, period),
      });
    }
  }

  return labels;
}

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function SalesChart({ payments, now }: Props) {
  const [period, setPeriod] = useState<Period>("monthly");
  const mounted = useMounted();

  const data = useMemo(() => {
    const currentDate = new Date(now);
    const labels = getLabels(period, currentDate);

    const totals = new Map<string, number>();

    labels.forEach((item) => {
      totals.set(item.key, 0);
    });

    payments.forEach((payment) => {
      const date = new Date(payment.date);
      const key = getDateKey(date, period);

      if (totals.has(key)) {
        totals.set(key, (totals.get(key) ?? 0) + payment.amount);
      }
    });

    return labels.map((item) => ({
      label: item.label,
      value: totals.get(item.key) ?? 0,
    }));
  }, [payments, period, now]);

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;

    const y = 100 - (item.value / maxValue) * 85;

    return { x, y, ...item };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${path} L 100 100 L 0 100 Z`;

  if (!mounted) {
    return (
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-xl bg-surface" />

          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-surface" />
            <div className="h-3 w-40 animate-pulse rounded bg-surface" />
          </div>
        </div>

        <div className="mt-8 h-56 animate-pulse rounded-xl bg-surface" />
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <TrendingUp className="size-5" />
          </div>

          <div>
            <h2 className="font-black text-ink">نمودار فروش</h2>

            <p className="mt-1 text-xs text-muted">بررسی روند فروش فروشگاه</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface p-1">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              aria-pressed={period === item.id}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:px-3 ${
                period === item.id
                  ? "bg-card text-brand shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total Sales */}
      <div className="mt-6">
        <p className="text-xs text-muted">مجموع فروش این بازه</p>

        <p className="mt-1 text-2xl font-black text-ink">
          {fa(total)}

          <span className="mr-2 text-sm font-medium text-muted">تومان</span>
        </p>
      </div>

      {/* Chart */}
      <div className="mt-8">
        <div className="relative h-56 w-full">
          {/* Grid Lines */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {[100, 75, 50, 25, 0].map((value) => (
              <div
                key={value}
                className="border-t border-dashed border-border"
              />
            ))}
          </div>

          {/* SVG */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            role="img"
            aria-label="نمودار روند فروش"
          >
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef394e" stopOpacity="0.25" />

                <stop offset="100%" stopColor="#ef394e" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={areaPath} fill="url(#salesGradient)" />

            <path
              d={path}
              fill="none"
              stroke="#ef394e"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="1.8"
                fill="#ef394e"
                stroke="var(--card)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              >
                <title>
                  {point.label}: {fa(point.value)} تومان
                </title>
              </circle>
            ))}
          </svg>
        </div>

        {/* Labels */}
        <div
          className="mt-4 grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          }}
        >
          {data.map((item, index) => (
            <div key={index} className="min-w-0 text-center">
              <p className="truncate text-[10px] text-muted sm:text-xs">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {total === 0 && (
        <p className="mt-4 text-center text-xs text-muted">
          در این بازه هنوز فروشی ثبت نشده است.
        </p>
      )}
    </section>
  );
}
