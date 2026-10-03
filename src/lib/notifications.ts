import "server-only";

import type { BookingStatusValue } from "@/lib/constants";
import { env } from "@/lib/env";
import { formatDateLong, formatTime } from "@/lib/time";
import type { NotificationChannelResult, NotificationOutcome } from "@/types";

// Notifikasi otomatis ke pelanggan saat admin mengonfirmasi atau membatalkan
// pesanan. Semua penyedia dipanggil lewat HTTP API biasa (fetch), jadi tidak
// ada dependency tambahan. Setiap kanal aktif hanya jika env-nya diisi:
//   - Email    : EMAIL_FROM + (BREVO_API_KEY atau RESEND_API_KEY)
//   - WhatsApp : FONNTE_TOKEN
// Kegagalan kirim TIDAK membatalkan perubahan status; hasilnya dilaporkan ke admin.

const REQUEST_TIMEOUT_MS = 8000;

export type NotifiableBooking = {
  code: string;
  customerName: string;
  customerEmail: string | null;
  customerWhatsapp: string | null;
  serviceName: string;
  startAt: Date;
  endAt: Date;
};

type MessageContent = {
  subject: string;
  /** Baris-baris pesan; dipakai untuk WhatsApp (teks) dan email (HTML). */
  lines: string[];
  linkLabel: string;
  linkUrl: string;
};

export function getNotificationChannels(): { email: boolean; whatsapp: boolean } {
  return {
    email: Boolean(env.EMAIL_FROM && (env.BREVO_API_KEY || env.RESEND_API_KEY)),
    whatsapp: Boolean(env.FONNTE_TOKEN),
  };
}

function getAppUrl(): string {
  if (env.APP_URL) return env.APP_URL.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "Nama <alamat@domain>" atau "alamat@domain" -> { name, email } */
function parseSender(from: string): { name: string; email: string } {
  const match = /^(.*)<([^<>]+)>\s*$/.exec(from);
  if (!match) return { name: env.BUSINESS_NAME, email: from.trim() };
  const name = (match[1] ?? "").trim().replace(/^"|"$/g, "");
  return { name: name || env.BUSINESS_NAME, email: (match[2] ?? "").trim() };
}

function buildMessage(booking: NotifiableBooking, status: "CONFIRMED" | "CANCELED"): MessageContent {
  const timeZone = env.BUSINESS_TIMEZONE;
  const details = [
    `Layanan: ${booking.serviceName}`,
    `Tanggal: ${formatDateLong(booking.startAt, timeZone)}`,
    `Jam: ${formatTime(booking.startAt, timeZone)} - ${formatTime(booking.endAt, timeZone)} (${timeZone})`,
    `Kode booking: ${booking.code}`,
  ];

  if (status === "CONFIRMED") {
    return {
      subject: `Pesanan Anda dikonfirmasi - ${env.BUSINESS_NAME}`,
      lines: [
        `Halo ${booking.customerName},`,
        `Pesanan Anda di ${env.BUSINESS_NAME} sudah DIKONFIRMASI.`,
        ...details,
        "Mohon datang tepat waktu. Terima kasih!",
      ],
      linkLabel: "Lihat detail pesanan",
      linkUrl: `${getAppUrl()}/booking/${booking.code}`,
    };
  }

  return {
    subject: `Pesanan Anda dibatalkan - ${env.BUSINESS_NAME}`,
    lines: [
      `Halo ${booking.customerName},`,
      `Mohon maaf, pesanan Anda di ${env.BUSINESS_NAME} DIBATALKAN.`,
      ...details,
      "Anda bisa memilih jadwal lain kapan saja.",
    ],
    linkLabel: "Pesan jadwal lain",
    linkUrl: getAppUrl(),
  };
}

function toPlainText(content: MessageContent): string {
  return [...content.lines, `${content.linkLabel}: ${content.linkUrl}`].join("\n");
}

function toHtml(content: MessageContent): string {
  const paragraphs = content.lines
    .map((line) => `<p style="margin:0 0 10px">${escapeHtml(line)}</p>`)
    .join("");
  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#333333;max-width:520px">',
    paragraphs,
    `<p style="margin:18px 0 0"><a href="${escapeHtml(content.linkUrl)}" style="display:inline-block;background:#2d6a4f;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px">${escapeHtml(content.linkLabel)}</a></p>`,
    "</div>",
  ].join("");
}

async function sendEmail(to: string, toName: string, content: MessageContent): Promise<NotificationChannelResult> {
  const from = env.EMAIL_FROM;
  if (!from || (!env.BREVO_API_KEY && !env.RESEND_API_KEY)) return "skipped";

  try {
    let response: Response;

    if (env.BREVO_API_KEY) {
      response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": env.BREVO_API_KEY,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: parseSender(from),
          to: [{ email: to, name: toName }],
          subject: content.subject,
          htmlContent: toHtml(content),
          textContent: toPlainText(content),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } else {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: content.subject,
          html: toHtml(content),
          text: toPlainText(content),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    }

    if (!response.ok) {
      console.error(`Notifikasi email gagal: HTTP ${response.status} ${await response.text()}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("Notifikasi email gagal:", error);
    return "failed";
  }
}

async function sendWhatsapp(target: string, content: MessageContent): Promise<NotificationChannelResult> {
  if (!env.FONNTE_TOKEN) return "skipped";

  try {
    // Fonnte menerima form-data. Nomor sudah tersimpan dalam format 62xxx.
    const form = new FormData();
    form.append("target", target);
    form.append("message", toPlainText(content));
    form.append("countryCode", "62");

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { authorization: env.FONNTE_TOKEN },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const payload: unknown = await response.json().catch(() => null);
    const accepted =
      response.ok &&
      typeof payload === "object" &&
      payload !== null &&
      "status" in payload &&
      payload.status === true;

    if (!accepted) {
      console.error(`Notifikasi WhatsApp gagal: HTTP ${response.status} ${JSON.stringify(payload)}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("Notifikasi WhatsApp gagal:", error);
    return "failed";
  }
}

/**
 * Mengirim notifikasi perubahan status ke kontak yang diisi pelanggan.
 * Hanya untuk CONFIRMED dan CANCELED. Tidak pernah melempar error.
 */
export async function sendBookingStatusNotification(
  booking: NotifiableBooking,
  status: BookingStatusValue,
): Promise<NotificationOutcome> {
  if (status !== "CONFIRMED" && status !== "CANCELED") {
    return { email: "skipped", whatsapp: "skipped" };
  }

  const content = buildMessage(booking, status);

  const [email, whatsapp] = await Promise.all([
    booking.customerEmail
      ? sendEmail(booking.customerEmail, booking.customerName, content)
      : Promise.resolve<NotificationChannelResult>("skipped"),
    booking.customerWhatsapp
      ? sendWhatsapp(booking.customerWhatsapp, content)
      : Promise.resolve<NotificationChannelResult>("skipped"),
  ]);

  return { email, whatsapp };
}
