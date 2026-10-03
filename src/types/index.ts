/**
 * Tipe hasil yang dikembalikan SEMUA Server Action.
 * `fieldErrors` opsional: pesan per field (kunci = path field, mis. "customerName").
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Satu slot waktu yang bisa dipesan. `startAt`/`endAt` adalah ISO string UTC. */
export type Slot = {
  startAt: string;
  endAt: string;
  /** Jam mulai dalam zona waktu bisnis, mis. "09:30". */
  label: string;
  /** Jam selesai dalam zona waktu bisnis, mis. "10:15". */
  endLabel: string;
};

export type NotificationChannelResult = "sent" | "failed" | "skipped";

/** Hasil pengiriman notifikasi ke pelanggan saat status pesanan berubah. */
export type NotificationOutcome = {
  email: NotificationChannelResult;
  whatsapp: NotificationChannelResult;
};

export type DayAvailabilityStatus = "OPEN" | "FULL" | "CLOSED" | "HOLIDAY" | "OUT_OF_RANGE";

export type DayAvailability = {
  /** Tanggal lokal bisnis, format "yyyy-MM-dd". */
  dateKey: string;
  status: DayAvailabilityStatus;
  slots: Slot[];
  holidayDescription: string | null;
};
