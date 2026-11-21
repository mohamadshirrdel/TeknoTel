import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import PhoneLinkForm from "@/components/auth/PhoneLinkForm";

export default async function CompleteProfilePage() {
  const session = await auth();
  const user = session?.user as
    | { phone?: string | null; name?: string | null; email?: string | null }
    | undefined;

  if (!user) redirect("/login");
  if (user.phone) redirect("/");

  return (
    <main className="grid min-h-screen place-items-center bg-surface p-4">
      <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-center text-xl font-black">تکمیل ثبت‌نام</h1>
        <p className="text-center text-sm leading-7 text-gray-500">
          {user.name ?? user.email} عزیز، برای ادامه و پیگیری سفارش‌ها لازم است
          شماره‌ی موبایل خود را ثبت و تأیید کنید.
        </p>

        <PhoneLinkForm />

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="w-full text-sm text-gray-400 hover:text-brand">
            خروج از حساب
          </button>
        </form>
      </div>
    </main>
  );
}