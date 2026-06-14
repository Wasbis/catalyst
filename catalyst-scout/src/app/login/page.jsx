import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Masuk — Project Maker by Catalyst",
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
          <div className="brand-mark">P</div>
          <div>
            <div className="login-name">Project Maker</div>
            <div className="login-sub">by Catalyst · Cliste</div>
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
