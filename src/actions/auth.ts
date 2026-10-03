"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";

import { signIn, signOut } from "@/auth";
import { fail, failFromZod, ok } from "@/lib/action-result";
import { getLoginKeys, isLoginBlocked, LOGIN_BLOCKED_MESSAGE } from "@/lib/login-throttle";
import { loginSchema, type LoginValues } from "@/lib/validations";
import type { ActionResult } from "@/types";

const DEFAULT_REDIRECT = "/admin";

/**
 * Hanya izinkan redirect ke path internal di bawah /admin, supaya parameter
 * callbackUrl tidak bisa dipakai untuk open redirect ke situs lain.
 */
function resolveRedirect(callbackUrl: string | undefined): string {
  if (!callbackUrl) return DEFAULT_REDIRECT;

  let path = callbackUrl;
  if (!callbackUrl.startsWith("/")) {
    try {
      const url = new URL(callbackUrl);
      path = `${url.pathname}${url.search}`;
    } catch {
      return DEFAULT_REDIRECT;
    }
  }

  const isAdminPath = path === "/admin" || path.startsWith("/admin/") || path.startsWith("/admin?");
  return isAdminPath ? path : DEFAULT_REDIRECT;
}

export async function loginAction(
  values: LoginValues,
  callbackUrl?: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);

  // Pemblokiran sebenarnya terjadi di authorize() (src/auth.ts); pengecekan di
  // sini hanya untuk menampilkan pesan yang jelas kepada pengguna.
  const loginKeys = getLoginKeys(parsed.data.email, await headers());
  if (await isLoginBlocked(loginKeys)) return fail(LOGIN_BLOCKED_MESSAGE);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type !== "CredentialsSignin") return fail("Gagal masuk. Silakan coba lagi.");
      // Percobaan yang baru saja gagal bisa jadi yang membuat batas terlampaui.
      if (await isLoginBlocked(loginKeys)) return fail(LOGIN_BLOCKED_MESSAGE);
      return fail("Email atau password salah.");
    }
    throw error;
  }

  return ok({ redirectTo: resolveRedirect(callbackUrl) });
}

export async function logoutAction(): Promise<ActionResult<{ redirectTo: string }>> {
  await signOut({ redirect: false });
  return ok({ redirectTo: "/login" });
}
