import type { ZodError } from "zod";

import type { ActionResult } from "@/types";

export const GENERIC_ERROR_MESSAGE = "Terjadi kesalahan di server. Silakan coba lagi.";

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

/** Mengubah ZodError menjadi ActionResult gagal, dengan pesan per field. */
export function failFromZod(error: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    const messages = fieldErrors[key] ?? [];
    messages.push(issue.message);
    fieldErrors[key] = messages;
  }
  const firstMessage = error.issues[0]?.message ?? "Input tidak valid.";
  return fail(firstMessage, fieldErrors);
}
