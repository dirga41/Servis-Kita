import "server-only";

import { prisma } from "@/lib/prisma";

// Pembatas percobaan login (anti brute force), disimpan di database karena
// memori server tidak bertahan antar-request di lingkungan serverless.
// Sengaja "fail-open": jika tabelnya bermasalah, login tetap bisa dipakai dan
// kesalahannya dicatat di log.

const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
/** Gagal sekian kali dari satu alamat IP dalam 15 menit -> diblokir sementara. */
const MAX_FAILURES_PER_IP = 5;
/** Batas kedua per email, untuk serangan dari banyak alamat IP sekaligus. */
const MAX_FAILURES_PER_EMAIL = 15;

export const LOGIN_BLOCKED_MESSAGE = "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.";

export type LoginKeys = { ipKey: string; emailKey: string };

type HeaderSource = { get(name: string): string | null };

export function getLoginKeys(email: string, headers: HeaderSource): LoginKeys {
  // Di Vercel, x-forwarded-for diisi oleh platform; alamat pertama adalah klien.
  const forwardedFor = headers.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return {
    ipKey: `ip:${ip}`,
    emailKey: `email:${email.trim().toLowerCase().slice(0, 120)}`,
  };
}

export async function isLoginBlocked(keys: LoginKeys): Promise<boolean> {
  try {
    const since = new Date(Date.now() - WINDOW_MS);
    const [ipFailures, emailFailures] = await Promise.all([
      prisma.loginAttempt.count({ where: { key: keys.ipKey, createdAt: { gte: since } } }),
      prisma.loginAttempt.count({ where: { key: keys.emailKey, createdAt: { gte: since } } }),
    ]);
    return ipFailures >= MAX_FAILURES_PER_IP || emailFailures >= MAX_FAILURES_PER_EMAIL;
  } catch (error) {
    console.error("Pembatas login gagal membaca data:", error);
    return false;
  }
}

export async function recordFailedLogin(keys: LoginKeys): Promise<void> {
  try {
    await prisma.loginAttempt.createMany({
      data: [{ key: keys.ipKey }, { key: keys.emailKey }],
    });
    // Bersihkan catatan lama supaya tabel tidak terus membesar.
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
    });
  } catch (error) {
    console.error("Pembatas login gagal mencatat percobaan:", error);
  }
}

export async function clearLoginAttempts(keys: LoginKeys): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({
      where: { key: { in: [keys.ipKey, keys.emailKey] } },
    });
  } catch (error) {
    console.error("Pembatas login gagal menghapus catatan:", error);
  }
}
