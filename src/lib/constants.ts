// File ini aman diimpor dari Client maupun Server Component (tanpa dependensi server).

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"] as const;

/** Sama persis dengan enum BookingStatus di Prisma, tanpa mengimpor @prisma/client ke client. */
export type BookingStatusValue = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatusValue, string> = {
  PENDING: "Menunggu konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  COMPLETED: "Selesai",
  CANCELED: "Dibatalkan",
};

/**
 * Perpindahan status yang diizinkan. COMPLETED dan CANCELED bersifat final;
 * khususnya CANCELED tidak bisa dihidupkan lagi karena slotnya mungkin sudah
 * dipakai pesanan lain.
 */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatusValue, readonly BookingStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["COMPLETED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
};

/** Indeks 0 = Minggu ... 6 = Sabtu (sama dengan Date#getDay dan kolom BusinessHours.dayOfWeek). */
export const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** Jarak antar awal slot, dalam menit. */
export const SLOT_STEP_MINUTES = 30;

/** Pesanan paling cepat dibuat sekian menit sebelum slot dimulai. */
export const MIN_LEAD_MINUTES = 60;

/** Pesanan bisa dibuat paling jauh sekian hari ke depan. */
export const MAX_ADVANCE_DAYS = 60;

/** Tanpa karakter yang mirip (I, O, 0, 1). 32 karakter ^ 12 = 2^60 kemungkinan. */
export const BOOKING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const BOOKING_CODE_LENGTH = 12;
