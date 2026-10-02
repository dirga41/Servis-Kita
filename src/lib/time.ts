// Util waktu murni (tanpa akses env/database) sehingga aman dipakai di client
// maupun server. Zona waktu selalu dikirim sebagai argumen; di server nilainya
// berasal dari env.BUSINESS_TIMEZONE.
//
// Istilah:
// - "dateKey" : tanggal kalender lokal bisnis, format "yyyy-MM-dd".
// - "time"    : jam lokal bisnis, format "HH:mm".
// - "instant" : objek Date biasa (titik waktu absolut / UTC).

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const DATE_KEY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

type DateParts = { year: number; month: number; day: number };

function parseDateKey(dateKey: string): DateParts | null {
  const match = DATE_KEY_REGEX.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Tolak tanggal yang tidak ada di kalender, mis. 2026-02-30.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function requireDateParts(dateKey: string): DateParts {
  const parts = parseDateKey(dateKey);
  if (!parts) {
    throw new Error(`Tanggal tidak valid: "${dateKey}"`);
  }
  return parts;
}

export function isValidDateKey(dateKey: string): boolean {
  return parseDateKey(dateKey) !== null;
}

export function isValidTimeString(time: string): boolean {
  return TIME_REGEX.test(time);
}

/** "09:30" -> 570 */
export function timeToMinutes(time: string): number {
  const match = TIME_REGEX.exec(time);
  if (!match) {
    throw new Error(`Jam tidak valid: "${time}"`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 570 -> "09:30" */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Jam dinding di zona waktu bisnis -> instant UTC. */
export function zonedDateTimeToUtc(dateKey: string, time: string, timeZone: string): Date {
  const { year, month, day } = requireDateParts(dateKey);
  const minutes = timeToMinutes(time);
  const zoned = new TZDate(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, timeZone);
  return new Date(zoned.getTime());
}

/** Instant -> tanggal kalender di zona waktu bisnis. */
export function toDateKey(instant: Date, timeZone: string): string {
  return format(new TZDate(instant.getTime(), timeZone), "yyyy-MM-dd");
}

export function todayDateKey(timeZone: string, now: Date = new Date()): string {
  return toDateKey(now, timeZone);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const { year, month, day } = requireDateParts(dateKey);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** 0 = Minggu ... 6 = Sabtu. */
export function dayOfWeekFromDateKey(dateKey: string): number {
  const { year, month, day } = requireDateParts(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Rentang [start, end) satu hari kalender bisnis, dalam instant UTC. */
export function getDayRangeUtc(dateKey: string, timeZone: string): { start: Date; end: Date } {
  return {
    start: zonedDateTimeToUtc(dateKey, "00:00", timeZone),
    end: zonedDateTimeToUtc(addDaysToDateKey(dateKey, 1), "00:00", timeZone),
  };
}

/** dateKey -> nilai untuk kolom DATE Prisma (tengah malam UTC). */
export function dateKeyToDbDate(dateKey: string): Date {
  const { year, month, day } = requireDateParts(dateKey);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Nilai kolom DATE Prisma -> dateKey. */
export function dbDateToDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "09:30" */
export function formatTime(instant: Date, timeZone: string): string {
  return format(new TZDate(instant.getTime(), timeZone), "HH:mm");
}

/** "Sabtu, 3 Oktober 2026" */
export function formatDateLong(instant: Date, timeZone: string): string {
  return format(new TZDate(instant.getTime(), timeZone), "EEEE, d MMMM yyyy", { locale: localeId });
}

/** "Sabtu, 3 Oktober 2026" dari dateKey. */
export function formatDateKeyLong(dateKey: string): string {
  const { year, month, day } = requireDateParts(dateKey);
  const noonUtc = new TZDate(Date.UTC(year, month - 1, day, 12), "UTC");
  return format(noonUtc, "EEEE, d MMMM yyyy", { locale: localeId });
}

/** "Sab, 3 Okt" dari dateKey. */
export function formatDateKeyShort(dateKey: string): string {
  const { year, month, day } = requireDateParts(dateKey);
  const noonUtc = new TZDate(Date.UTC(year, month - 1, day, 12), "UTC");
  return format(noonUtc, "EEE, d MMM", { locale: localeId });
}
