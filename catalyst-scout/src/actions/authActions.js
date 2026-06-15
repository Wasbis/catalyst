"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

const ALLOWED_EMAIL_DOMAIN = "@cliste.co.id";

export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email atau password salah." };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Email atau password salah." };
  }

  const token = await createSessionToken(user);
  await setSessionCookie(token);

  redirect("/tenders");
}

export async function registerAction(prevState, formData) {
  const name = formData.get("name")?.toString().trim();
  const username = formData.get("username")?.toString().trim().toLowerCase();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!name || !username || !email || !password || !confirmPassword) {
    return { error: "Semua field wajib diisi." };
  }

  if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return { error: `Email harus menggunakan domain ${ALLOWED_EMAIL_DOMAIN}.` };
  }

  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return { error: "Email atau username sudah terdaftar." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, username, email, passwordHash },
  });

  const token = await createSessionToken(user);
  await setSessionCookie(token);

  redirect("/tenders");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
