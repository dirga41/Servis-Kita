import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminUser = { id: string; email: string; name: string };

export const UNAUTHORIZED_MESSAGE = "Sesi berakhir atau Anda tidak punya akses. Silakan masuk kembali.";

/**
 * Admin yang sedang login, atau null. Selain memeriksa sesi, akun dicek ulang
 * ke database, sehingga sesi milik akun yang sudah dihapus langsung tidak
 * berlaku. `cache` membuat pengecekan hanya berjalan sekali per request.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true },
  });
});

/**
 * Untuk halaman/layout admin: redirect ke /login jika bukan admin.
 * Di Server Action pakai getCurrentAdmin() dan kembalikan
 * fail(UNAUTHORIZED_MESSAGE) agar tipe hasilnya tetap ActionResult.
 */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}
