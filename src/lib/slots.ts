import "server-only";

import { computeAvailableSlots } from "@/lib/availability";
import { MAX_ADVANCE_DAYS, MIN_LEAD_MINUTES, SLOT_STEP_MINUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  addDaysToDateKey,
  dateKeyToDbDate,
  dayOfWeekFromDateKey,
  getDayRangeUtc,
  isValidDateKey,
  toDateKey,
  todayDateKey,
} from "@/lib/time";
import type { DayAvailability, DayAvailabilityStatus } from "@/types";

/** Rentang tanggal yang boleh dipesan: hari ini s.d. MAX_ADVANCE_DAYS ke depan. */
export function getBookingWindow(now: Date = new Date()): { minDateKey: string; maxDateKey: string } {
  const minDateKey = todayDateKey(env.BUSINESS_TIMEZONE, now);
  return { minDateKey, maxDateKey: addDaysToDateKey(minDateKey, MAX_ADVANCE_DAYS) };
}

function emptyDay(
  dateKey: string,
  status: DayAvailabilityStatus,
  holidayDescription: string | null = null,
): DayAvailability {
  return { dateKey, status, slots: [], holidayDescription };
}

/**
 * Menghitung slot yang masih tersedia pada satu tanggal, dari jam operasional,
 * hari libur, durasi layanan, dan booking yang sudah ada.
 */
export async function getDayAvailability(params: {
  dateKey: string;
  durationMinutes: number;
  now?: Date;
}): Promise<DayAvailability> {
  const { dateKey, durationMinutes } = params;
  const now = params.now ?? new Date();
  const timeZone = env.BUSINESS_TIMEZONE;

  if (!isValidDateKey(dateKey)) return emptyDay(dateKey, "OUT_OF_RANGE");

  const { minDateKey, maxDateKey } = getBookingWindow(now);
  // Format "yyyy-MM-dd" bisa dibandingkan langsung sebagai string.
  if (dateKey < minDateKey || dateKey > maxDateKey) return emptyDay(dateKey, "OUT_OF_RANGE");

  const { start, end } = getDayRangeUtc(dateKey, timeZone);

  const [holiday, hours, busy] = await Promise.all([
    prisma.holiday.findUnique({ where: { date: dateKeyToDbDate(dateKey) } }),
    prisma.businessHours.findUnique({ where: { dayOfWeek: dayOfWeekFromDateKey(dateKey) } }),
    prisma.booking.findMany({
      where: {
        status: { not: "CANCELED" },
        startAt: { lt: end },
        endAt: { gt: start },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  if (holiday) return emptyDay(dateKey, "HOLIDAY", holiday.description);
  if (!hours || hours.isClosed) return emptyDay(dateKey, "CLOSED");

  const slots = computeAvailableSlots({
    dateKey,
    durationMinutes,
    hours,
    busy,
    now,
    timeZone,
    stepMinutes: SLOT_STEP_MINUTES,
    minLeadMinutes: MIN_LEAD_MINUTES,
  });

  return {
    dateKey,
    status: slots.length > 0 ? "OPEN" : "FULL",
    slots,
    holidayDescription: null,
  };
}

/**
 * Pengecekan ulang di server sebelum menyimpan booking: slot yang dikirim
 * client harus benar-benar salah satu slot yang sah dan masih kosong.
 * Balapan antar-request tetap dijaga exclusion constraint di database.
 */
export async function isSlotAvailable(params: {
  startAt: Date;
  durationMinutes: number;
  now?: Date;
}): Promise<boolean> {
  const dateKey = toDateKey(params.startAt, env.BUSINESS_TIMEZONE);
  const availability = await getDayAvailability({
    dateKey,
    durationMinutes: params.durationMinutes,
    now: params.now,
  });
  const startIso = params.startAt.toISOString();
  return availability.slots.some((slot) => slot.startAt === startIso);
}
