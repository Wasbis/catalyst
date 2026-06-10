import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
            C
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Catalyst</h1>
          <p className="mt-1 text-sm text-foreground-muted">Masuk ke dashboard Cliste</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
