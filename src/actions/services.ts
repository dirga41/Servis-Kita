"use server";

import { revalidatePath } from "next/cache";

import { fail, failFromZod, GENERIC_ERROR_MESSAGE, ok } from "@/lib/action-result";
import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isRecordNotFound } from "@/lib/prisma-errors";
import {
  serviceActiveSchema,
  serviceFormSchema,
  serviceIdSchema,
  type ServiceActiveValues,
  type ServiceFormValues,
} from "@/lib/validations";
import type { ActionResult } from "@/types";

const SERVICE_NOT_FOUND_MESSAGE = "Layanan tidak ditemukan.";

function revalidateServicePages(): void {
  revalidatePath("/admin/services");
  revalidatePath("/");
}

export async function createServiceAction(
  values: ServiceFormValues,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(UNAUTHORIZED_MESSAGE);

  const parsed = serviceFormSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);
  const data = parsed.data;

  try {
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description ? data.description : null,
        durationMinutes: data.durationMinutes,
        price: data.price,
        isActive: data.isActive,
      },
      select: { id: true },
    });
    revalidateServicePages();
    return ok({ id: service.id });
  } catch (error) {
    console.error("createServiceAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}

export async function updateServiceAction(
  serviceId: string,
  values: ServiceFormValues,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(UNAUTHORIZED_MESSAGE);

  const parsedId = serviceIdSchema.safeParse(serviceId);
  if (!parsedId.success) return failFromZod(parsedId.error);

  const parsed = serviceFormSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);
  const data = parsed.data;

  try {
    // Booking lama tidak terpengaruh: nama, harga, dan durasinya sudah
    // tersimpan sebagai snapshot di tabel Booking.
    const service = await prisma.service.update({
      where: { id: parsedId.data },
      data: {
        name: data.name,
        description: data.description ? data.description : null,
        durationMinutes: data.durationMinutes,
        price: data.price,
        isActive: data.isActive,
      },
      select: { id: true },
    });
    revalidateServicePages();
    return ok({ id: service.id });
  } catch (error) {
    if (isRecordNotFound(error)) return fail(SERVICE_NOT_FOUND_MESSAGE);
    console.error("updateServiceAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}

export async function setServiceActiveAction(
  values: ServiceActiveValues,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return fail(UNAUTHORIZED_MESSAGE);

  const parsed = serviceActiveSchema.safeParse(values);
  if (!parsed.success) return failFromZod(parsed.error);

  try {
    const service = await prisma.service.update({
      where: { id: parsed.data.serviceId },
      data: { isActive: parsed.data.isActive },
      select: { id: true, isActive: true },
    });
    revalidateServicePages();
    return ok({ id: service.id, isActive: service.isActive });
  } catch (error) {
    if (isRecordNotFound(error)) return fail(SERVICE_NOT_FOUND_MESSAGE);
    console.error("setServiceActiveAction gagal:", error);
    return fail(GENERIC_ERROR_MESSAGE);
  }
}
