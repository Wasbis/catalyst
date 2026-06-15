"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { loginAction } from "@/actions/authActions";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

const initialState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="dewi@cliste.co.id" />
      </div>

      <div>
        <Label htmlFor="password">Kata sandi</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••••••" />
      </div>

      {state?.error && <p className="m-0 text-[13px] text-danger">{state.error}</p>}

      <Button type="submit" loading={pending} className="w-full justify-center">
        {pending ? "Memproses..." : "Masuk"}
      </Button>

      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-center text-[11.5px] leading-snug text-foreground-subtle">
        <ShieldCheck size={12} strokeWidth={2} className="shrink-0" />
        Belum punya akun? <Link href="/register" className="text-accent">Daftar</Link> · JWT httpOnly session
      </div>
    </form>
  );
}
