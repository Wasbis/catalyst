import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Masuk — Catalyst",
};

export default function LoginPage() {
  return (
    <div className="login-screen">
      {/* Animated background */}
      <div className="login-bg" />

      {/* Card */}
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-mark">C</div>
          <div>
            <div className="login-name">Catalyst</div>
            <div className="login-sub">Tender Platform · Cliste</div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="login-title">Masuk ke workspace</h1>
        <p className="login-desc">
          Platform pengelolaan tender end-to-end —{" "}
          dari penemuan{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>peluang</span>{" "}
          hingga proposal.
        </p>

        {/* Form */}
        <LoginForm />
      </div>
    </div>
  );
}
