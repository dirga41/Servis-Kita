// Skema Zod yang dipakai BERSAMA oleh form di client (lewat zodResolver) dan
// Server Action (divalidasi ulang). Jangan impor modul server ke file ini.
//
// Semua skema sengaja dibuat dengan tipe input = tipe output (tanpa coerce
// atau transform yang mengubah tipe), supaya z.infer bisa langsung dipakai
// sebagai tipe nilai React Hook Form.

import { z } from "zod";

import { BOOKING_STATUSES } from "@/lib/constants";
import { isValidDateKey, isValidTimeString } from "@/lib/time";

// Nomor seluler Indonesia: 08xx, 628xx, atau +628xx (spasi/tanda hubung diabaikan).
const WHATSAPP_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

function isValidWhatsapp(value: string): boolean {
  return WHATSAPP_REGEX.test(value.replace(/[\s-]/g, ""));
}

function isValidEmail(value: string): boolean {
  return z.string().email().safeParse(value).success;
}

export const dateKeySchema = z
  .string()
  .refine(isValidDateKey, "Tanggal tidak valid.");

const timeStringSchema = z
  .string()
  .refine(isValidTimeString, "Jam harus berformat HH:mm.");

// --- Autentikasi ------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});
export type LoginValues = z.infer<typeof loginSchema>;

// --- Pemesanan (publik) -----------------------------------------------------

export const bookingFormSchema = z
  .object({
    serviceId: z.string().min(1, "Layanan wajib dipilih."),
    startAt: z.string().datetime({ message: "Pilih slot waktu terlebih dahulu." }),
    customerName: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(80, "Nama maksimal 80 karakter."),
    customerWhatsapp: z
      .string()
      .trim()
      .max(20, "Nomor WhatsApp terlalu panjang.")
      .refine((value) => value === "" || isValidWhatsapp(value), "Nomor WhatsApp tidak valid, contoh: 081234567890."),
    customerEmail: z
      .string()
      .trim()
      .max(120, "Email terlalu panjang.")
      .refine((value) => value === "" || isValidEmail(value), "Format email tidak valid."),
    notes: z.string().trim().max(500, "Catatan maksimal 500 karakter."),
  })
  .superRefine((value, ctx) => {
    if (value.customerWhatsapp === "" && value.customerEmail === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerWhatsapp"],
        message: "Isi minimal salah satu: WhatsApp atau email.",
      });
    }
  });
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// --- Admin: status pesanan --------------------------------------------------

export const bookingStatusUpdateSchema = z.object({
  bookingId: z.string().min(1, "ID pesanan tidak valid."),
  status: z.enum(BOOKING_STATUSES, { errorMap: () => ({ message: "Status tidak valid." }) }),
});
export type BookingStatusUpdateValues = z.infer<typeof bookingStatusUpdateSchema>;

// --- Admin: layanan ---------------------------------------------------------

export const serviceFormSchema = z.object({
  name: z.string().trim().min(2, "Nama layanan minimal 2 karakter.").max(80, "Nama layanan maksimal 80 karakter."),
  description: z.string().trim().max(300, "Deskripsi maksimal 300 karakter."),
  durationMinutes: z
    .number({ required_error: "Durasi wajib diisi.", invalid_type_error: "Durasi harus berupa angka." })
    .int("Durasi harus bilangan bulat.")
    .min(5, "Durasi minimal 5 menit.")
    .max(480, "Durasi maksimal 480 menit.")
    .multipleOf(5, "Durasi harus kelipatan 5 menit."),
  price: z
    .number({ required_error: "Harga wajib diisi.", invalid_type_error: "Harga harus berupa angka." })
    .int("Harga harus bilangan bulat (rupiah).")
    .min(0, "Harga tidak boleh negatif.")
    .max(100_000_000, "Harga maksimal Rp 100.000.000."),
  isActive: z.boolean(),
});
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const serviceIdSchema = z.string().min(1, "ID layanan tidak valid.");

export const serviceActiveSchema = z.object({
  serviceId: serviceIdSchema,
  isActive: z.boolean(),
});
export type ServiceActiveValues = z.infer<typeof serviceActiveSchema>;

// --- Admin: jam operasional -------------------------------------------------

export const dayHoursSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: timeStringSchema,
    closeTime: timeStringSchema,
    isClosed: z.boolean(),
  })
  .refine((value) => value.isClosed || value.openTime < value.closeTime, {
    path: ["closeTime"],
    message: "Jam tutup harus setelah jam buka.",
  });

export const businessHoursFormSchema = z.object({
  days: z
    .array(dayHoursSchema)
    .length(7, "Jam operasional harus berisi tepat 7 hari.")
    .refine(
      (days) => new Set(days.map((day) => day.dayOfWeek)).size === 7,
      "Setiap hari hanya boleh muncul satu kali.",
    ),
});
export type BusinessHoursFormValues = z.infer<typeof businessHoursFormSchema>;

// --- Admin: hari libur ------------------------------------------------------

export const holidayFormSchema = z.object({
  date: dateKeySchema,
  description: z.string().trim().max(100, "Keterangan maksimal 100 karakter."),
});
export type HolidayFormValues = z.infer<typeof holidayFormSchema>;

export const holidayIdSchema = z.string().min(1, "ID hari libur tidak valid.");
