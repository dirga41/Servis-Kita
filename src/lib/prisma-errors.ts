import "server-only";

import { Prisma } from "@prisma/client";

/** Nama exclusion constraint di prisma/migrations/20261003000000_init/migration.sql. */
export const BOOKING_OVERLAP_CONSTRAINT = "Booking_no_overlap";

/** SQLSTATE PostgreSQL untuk exclusion_violation. */
const EXCLUSION_VIOLATION_CODE = "23P01";

function mentionsOverlap(text: string): boolean {
  return text.includes(BOOKING_OVERLAP_CONSTRAINT) || text.includes(EXCLUSION_VIOLATION_CODE);
}

/**
 * True jika error berasal dari exclusion constraint anti double-booking.
 * Prisma tidak punya kode khusus untuk 23P01: error ini muncul sebagai
 * PrismaClientUnknownRequestError (atau KnownRequestError dengan detail di
 * `meta`), jadi dikenali dari SQLSTATE / nama constraint di pesannya.
 */
export function isBookingOverlapError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (mentionsOverlap(error.message)) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return mentionsOverlap(JSON.stringify(error.meta ?? {}));
  }
  return false;
}

/** True jika error adalah pelanggaran unique constraint (P2002), opsional untuk field tertentu. */
export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;
  if (!field) return true;
  return JSON.stringify(error.meta ?? {}).includes(field);
}

/** True jika record yang akan diubah/dihapus tidak ditemukan (P2025). */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
