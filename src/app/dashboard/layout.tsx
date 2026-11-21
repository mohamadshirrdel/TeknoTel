import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <Header />

      <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-6 md:grid-cols-4">
        <DashboardSidebar />

        <main className="min-w-0 md:col-span-3">
          {children}
        </main>
      </div>
    </>
  );
}