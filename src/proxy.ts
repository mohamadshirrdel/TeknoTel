import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as
    | { role?: string; phone?: string | null }
    | undefined;

  // وارد شده ولی بدون شماره: فقط صفحه‌ی تکمیل ثبت‌نام مجاز است
  if (user && !user.phone && pathname !== "/complete-profile") {
    return NextResponse.redirect(new URL("/complete-profile", req.url));
  }

  // شماره‌دار نباید در صفحه‌ی تکمیل بماند
  if (user?.phone && pathname === "/complete-profile") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout")) &&
    !user
  )
    return NextResponse.redirect(new URL("/login", req.url));

  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
    if (user.role !== "ADMIN")
      return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
