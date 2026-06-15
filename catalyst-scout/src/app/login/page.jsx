import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Masuk — Project Maker by Catalyst",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-base">
      <div className="relative w-105 max-w-[92vw] rounded-[22px] border border-border bg-surface p-9 pb-7">
        <div className="mb-6 flex items-center gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-accent text-xl font-medium text-white">P</div>
          <div>
            <div className="text-lg font-medium leading-tight text-foreground">Project Maker</div>
            <div className="mt-px text-xs font-medium text-foreground-subtle">by Catalyst · Cliste</div>
          </div>
        </div>

        <h1 className="mb-2 text-[22px] font-medium leading-tight text-foreground">Masuk ke workspace</h1>
        <p className="mb-5.5 text-[13.5px] leading-relaxed text-foreground-muted">
          Platform pengelolaan tender end-to-end —{" "}
          dari penemuan{" "}
          <span className="text-accent">peluang</span>{" "}
          hingga proposal.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
