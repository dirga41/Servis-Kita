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
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  BUSINESS_TIMEZONE: process.env.BUSINESS_TIMEZONE,
  BUSINESS_NAME: process.env.BUSINESS_NAME,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `- ${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Environment variable tidak valid:\n${details}`);
}

export const env = parsed.data;

export type Env = typeof env;
