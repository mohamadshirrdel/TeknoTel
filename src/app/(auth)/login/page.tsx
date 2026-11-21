import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-center text-2xl font-black text-brand">
          تکنو<span className="text-ink">تل</span>
        </h1>

        <p className="mb-6 mt-2 text-center text-sm text-muted">
          ورود یا ثبت‌نام
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
