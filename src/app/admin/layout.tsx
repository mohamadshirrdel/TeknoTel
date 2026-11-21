import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const user = session?.user as { role?: string } | undefined;

  // بررسی ورود کاربر
  if (!user) redirect("/login");

  // بررسی دسترسی مدیر
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-surface md:flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="min-w-0 flex-1 bg-surface text-ink">
        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}