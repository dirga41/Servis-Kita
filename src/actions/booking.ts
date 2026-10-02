"use server";

import { revalidatePath } from "next/cache";

import { fail, failFromZod, GENERIC_ERROR_MESSAGE, ok } from "@/lib/action-result";
import { generateBookingCode } from "@/lib/booking-code";
import { normalizeWhatsapp } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isBookingOverlapError, isUniqueViolation } from "@/lib/prisma-errors";
import { isSlotAvailable } from "@/lib/slots";
import { bookingFormSchema, type BookingFormValues } from "@/lib/validations";
import type { ActionResult } from "@/types";

const SLOT_TAKEN_MESSAGE = "Slot sudah terisi. Silakan pilih jam lain.";
const MAX_CODE_ATTEMPTS = 5;
const MS_PER_MINUTE = 60_000;

export async function createBookingAction(
  values: BookingFormValues,
): Promise<ActionResult<{ code: string }>> {
  // Validasi ulang di server; jangan percaya input client.
  const parsed = bookingFormSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);
  const data = parsed.data;

  try {
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, isActive: true },
    });
    if (!service) return fail("Layanan tidak ditemukan atau sudah tidak aktif.");

    // Durasi, harga, dan jam selesai SELALU dihitung dari data server.
    const startAt = new Date(data.startAt);
    const endAt = new Date(startAt.getTime() + service.durationMinutes * MS_PER_MINUTE);

    // Slot harus sah menurut jam operasional, hari libur, dan booking lain.
    const available = await isSlotAvailable({ startAt, durationMinutes: service.durationMinutes });
    if (!available) return fail(SLOT_TAKEN_MESSAGE);

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateBookingCode();
      try {
        await prisma.booking.create({
          data: {
            code,
            serviceId: service.id,
            serviceName: service.name,
            servicePrice: service.price,
            serviceDurationMinutes: service.durationMinutes,
            customerName: data.customerName,
            customerWhatsapp: data.customerWhatsapp ? normalizeWhatsapp(data.customerWhatsapp) : null,
            customerEmail: data.customerEmail ? data.customerEmail.toLowerCase() : null,
            notes: data.notes ? data.notes : null,
            startAt,
            endAt,
          },
        });
        revalidatePath("/admin");
        return ok({ code });
      } catch (error) {
        // Dua pelanggan memesan slot yang sama hampir bersamaan: exclusion
        // constraint di database menolak yang kedua.
        if (isBookingOverlapError(error)) return fail(SLOT_TAKEN_MESSAGE);
        // Kode kebetulan sama dengan yang sudah ada: coba kode baru.
        if (isUniqueViolation(error, "code")) continue;
        throw error;
      }
    }

    return fail(GENERIC_ERROR_MESSAGE);
  } catch (error) {
    console.error("createBookingAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}
