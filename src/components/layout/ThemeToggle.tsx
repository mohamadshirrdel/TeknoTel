"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="grid size-11 place-items-center rounded-xl border border-gray-200 dark:border-gray-700">
        <span className="size-5" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "فعال کردن تم روشن" : "فعال کردن تم تاریک"}
      title={isDark ? "تم روشن" : "تم تاریک"}
      className="grid size-11 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-brand/40 hover:bg-red-50 hover:text-brand dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
