"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// جلوگیری از نمایش هشدار شناخته‌شده next-themes در React 19
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    const message = args[0];

    if (
      typeof message === "string" &&
      message.includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }

    originalConsoleError.apply(console, args);
  };
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}