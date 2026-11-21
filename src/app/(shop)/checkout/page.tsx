import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CheckoutForm from "@/components/shop/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    select: { id: true, title: true, province: true, city: true, street: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">ثبت سفارش</h1>
      <CheckoutForm addresses={addresses} />
    </div>
  );
}
