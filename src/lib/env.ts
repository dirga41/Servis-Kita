import "server-only";

import { z } from "zod";

function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const postgresUrl = (name: string) =>
  z
    .string({ required_error: `${name} wajib diisi.` })
    .regex(/^postgres(ql)?:\/\//, `${name} harus diawali "postgresql://".`);

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: postgresUrl("DATABASE_URL"),
  DIRECT_URL: postgresUrl("DIRECT_URL"),
  AUTH_SECRET: z
    .string({ required_error: "AUTH_SECRET wajib diisi." })
    .min(32, "AUTH_SECRET minimal 32 karakter."),
  BUSINESS_TIMEZONE: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .refine(isValidTimeZone, "BUSINESS_TIMEZONE harus zona waktu IANA yang valid, mis. Asia/Jakarta.")
      .default("Asia/Jakarta"),
  ),
  BUSINESS_NAME: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(60).default("Servis Kita")),

  // --- Opsional: notifikasi ke pelanggan (lihat src/lib/notifications.ts) ---
  APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url("APP_URL harus URL lengkap, mis. https://servis-kita.vercel.app.").optional(),
  ),
  // Diisi otomatis oleh Vercel; dipakai sebagai cadangan bila APP_URL kosong.
  VERCEL_PROJECT_PRODUCTION_URL: optionalText,
  EMAIL_FROM: optionalText,
  RESEND_API_KEY: optionalText,
  BREVO_API_KEY: optionalText,
  FONNTE_TOKEN: optionalText,
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  BUSINESS_TIMEZONE: process.env.BUSINESS_TIMEZONE,
  BUSINESS_NAME: process.env.BUSINESS_NAME,
  APP_URL: process.env.APP_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  FONNTE_TOKEN: process.env.FONNTE_TOKEN,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `- ${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Environment variable tidak valid:\n${details}`);
}

export const env = parsed.data;

export type Env = typeof env;
