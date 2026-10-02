// Perhitungan slot murni: tidak menyentuh database maupun env, sehingga mudah
// diuji. Pengambilan datanya ada di src/lib/slots.ts.

import { minutesToTime, timeToMinutes, zonedDateTimeToUtc } from "@/lib/time";
import type { Slot } from "@/types";

export type BusyInterval = { startAt: Date; endAt: Date };

export type DayHours = { openTime: string; closeTime: string; isClosed: boolean };

export type SlotComputationInput = {
  dateKey: string;
  durationMinutes: number;
  hours: DayHours;
  /** Booking yang tidak CANCELED dan beririsan dengan hari tersebut. */
  busy: BusyInterval[];
  now: Date;
  timeZone: string;
  stepMinutes: number;
  minLeadMinutes: number;
};

const MS_PER_MINUTE = 60_000;

export function computeAvailableSlots(input: SlotComputationInput): Slot[] {
  const { dateKey, durationMinutes, hours, busy, now, timeZone, stepMinutes, minLeadMinutes } = input;

  if (hours.isClosed || durationMinutes <= 0 || stepMinutes <= 0) return [];

  const openMinutes = timeToMinutes(hours.openTime);
  const closeMinutes = timeToMinutes(hours.closeTime);
  if (closeMinutes <= openMinutes) return [];

  const earliestStartMs = now.getTime() + minLeadMinutes * MS_PER_MINUTE;
  const slots: Slot[] = [];

  // Layanan harus selesai paling lambat tepat pada jam tutup.
  for (let minute = openMinutes; minute + durationMinutes <= closeMinutes; minute += stepMinutes) {
    const label = minutesToTime(minute);
    const start = zonedDateTimeToUtc(dateKey, label, timeZone);
    const startMs = start.getTime();
    const endMs = startMs + durationMinutes * MS_PER_MINUTE;

    if (startMs < earliestStartMs) continue;

    const overlaps = busy.some(
      (interval) => startMs < interval.endAt.getTime() && endMs > interval.startAt.getTime(),
    );
    if (overlaps) continue;

    slots.push({
      startAt: start.toISOString(),
      endAt: new Date(endMs).toISOString(),
      label,
    });
  }

  return slots;
}
