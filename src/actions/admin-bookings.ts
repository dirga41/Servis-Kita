"use server";

import { revalidatePath } from "next/cache";

import { fail, failFromZod, GENERIC_ERROR_MESSAGE, ok } from "@/lib/action-result";
import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth-guard";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_TRANSITIONS,
  type BookingStatusValue,
} from "@/lib/constants";
import { sendBookingStatusNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { bookingStatusUpdateSchema, type BookingStatusUpdateValues } from "@/lib/validations";
import type { ActionResult, NotificationOutcome } from "@/types";

export async function updateBookingStatusAction(
  values: BookingStatusUpdateValues,
): Promise<ActionResult<{ id: string; status: BookingStatusValue; notifications: NotificationOutcome }>> {
  // Middleware saja tidak cukup: Server Action bisa dipanggil langsung.
  const admin = await getCurrentAdmin();
  if (!admin) return fail(UNAUTHORIZED_MESSAGE);

  const parsed = bookingStatusUpdateSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);
  const { bookingId, status: nextStatus } = parsed.data;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        code: true,
        customerName: true,
        customerEmail: true,
        customerWhatsapp: true,
        serviceName: true,
        startAt: true,
        endAt: true,
      },
    });
    if (!booking) return fail("Pesanan tidak ditemukan.");

    const allowed = BOOKING_STATUS_TRANSITIONS[booking.status];
    if (!allowed.includes(nextStatus)) {
      return fail(
        `Status "${BOOKING_STATUS_LABELS[booking.status]}" tidak bisa diubah menjadi "${BOOKING_STATUS_LABELS[nextStatus]}".`,
      );
    }

    // Syarat status lama ikut di WHERE supaya dua admin yang menekan tombol
    // bersamaan tidak saling menimpa (dan notifikasi tidak terkirim dua kali).
    const result = await prisma.booking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: { status: nextStatus },
    });
    if (result.count === 0) {
      return fail("Status pesanan sudah berubah. Muat ulang halaman lalu coba lagi.");
    }

    // Status sudah tersimpan. Notifikasi dikirim setelahnya; jika gagal,
    // status tetap berubah dan admin diberi tahu hasilnya.
    const notifications = await sendBookingStatusNotification(booking, nextStatus);

    revalidatePath("/admin");
    return ok({ id: booking.id, status: nextStatus, notifications });
  } catch (error) {
    console.error("updateBookingStatusAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}
