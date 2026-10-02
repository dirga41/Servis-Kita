"use server";

import { revalidatePath } from "next/cache";

import { fail, failFromZod, GENERIC_ERROR_MESSAGE, ok } from "@/lib/action-result";
import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth-guard";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { isRecordNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { dateKeyToDbDate, getDayRangeUtc, todayDateKey } from "@/lib/time";
import {
  businessHoursFormSchema,
  holidayFormSchema,
  holidayIdSchema,
  type BusinessHoursFormValues,
  type HolidayFormValues,
} from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function saveBusinessHoursAction(
  values: BusinessHoursFormValues,
): Promise<ActionResult<{ updated: number }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(UNAUTHORIZED_MESSAGE);

  const parsed = businessHoursFormSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);

  try {
    // Satu transaksi: ketujuh hari tersimpan semua atau tidak sama sekali.
    const rows = await prisma.$transaction(
      parsed.data.days.map((day) =>
        prisma.businessHours.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          update: { openTime: day.openTime, closeTime: day.closeTime, isClosed: day.isClosed },
          create: {
            dayOfWeek: day.dayOfWeek,
            openTime: day.openTime,
            closeTime: day.closeTime,
            isClosed: day.isClosed,
          },
        }),
      ),
    );
    revalidatePath("/admin/schedule");
    return ok({ updated: rows.length });
  } catch (error) {
    console.error("saveBusinessHoursAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}

export async function addHolidayAction(
  values: HolidayFormValues,
): Promise<ActionResult<{ id: string; activeBookings: number }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(UNAUTHORIZED_MESSAGE);

  const parsed = holidayFormSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);
  const { date, description } = parsed.data;

  const timeZone = env.BUSINESS_TIMEZONE;
  if (date < todayDateKey(timeZone)) {
    return fail("Tanggal libur tidak boleh di masa lalu.", { date: ["Tanggal libur tidak boleh di masa lalu."] });
  }

  try {
    const holiday = await prisma.holiday.create({
      data: {
        date: dateKeyToDbDate(date),
        description: description ? description : null,
      },
      select: { id: true },
    });

    // Pesanan yang sudah ada tidak dibatalkan otomatis; admin diberi tahu
    // jumlahnya supaya bisa menghubungi pelanggan.
    const { start, end } = getDayRangeUtc(date, timeZone);
    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { gte: start, lt: end },
      },
    });

    revalidatePath("/admin/schedule");
    return ok({ id: holiday.id, activeBookings });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Tanggal tersebut sudah terdaftar sebagai hari libur.", {
        date: ["Tanggal tersebut sudah terdaftar sebagai hari libur."],
      });
    }
    console.error("addHolidayAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}

export async function deleteHolidayAction(holidayId: string): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(UNAUTHORIZED_MESSAGE);

  const parsed = holidayIdSchema.safeParse(holidayId);
  if (!parsed.success) return failFromZod(parsed.error);

  try {
    const holiday = await prisma.holiday.delete({
      where: { id: parsed.data },
      select: { id: true },
    });
    revalidatePath("/admin/schedule");
    return ok({ id: holiday.id });
  } catch (error) {
    if (isRecordNotFound(error)) return fail("Hari libur tidak ditemukan.");
    console.error("deleteHolidayAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}
