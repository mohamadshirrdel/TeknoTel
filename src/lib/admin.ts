import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
}
