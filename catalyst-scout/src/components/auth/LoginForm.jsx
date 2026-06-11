"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/authActions";

const initialState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="login-form">
      {/* Email field */}
      <div className="field">
        <label className="field-label" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="dewi@cliste.co.id"
          className="input"
        />
      </div>

      {/* Password field */}
      <div className="field">
        <label className="field-label" htmlFor="password">Kata sandi</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••••"
          className="input"
        />
      </div>

      {/* Error */}
      {state?.error && (
        <p style={{ fontSize: 13, color: "#be123c", margin: 0 }}>
          {state.error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary full"
        style={{ padding: "11px", fontSize: 15, justifyContent: "center" }}
      >
        {pending ? "Memproses..." : "Masuk"}
      </button>

      {/* Footer note */}
      <div className="login-foot">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#93a0b3", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Registrasi user hanya melalui admin · JWT httpOnly session
      </div>
    </form>
  );
}
