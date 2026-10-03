import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Check, CircleCheck, CircleX, Clock, Hourglass, Wallet } from "lucide-react";

import { CopyLinkButton } from "@/components/booking/copy-link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isBookingCodeFormat, normalizeBookingCode } from "@/lib/booking-code";
import { BOOKING_STATUS_LABELS, type BookingStatusValue } from "@/lib/constants";
import { env } from "@/lib/env";
import { formatDuration, formatRupiah } from "@/lib/format";
import { getNotificationChannels } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateLong, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail pesanan",
  // Halaman ini hanya untuk pemegang kode; jangan diindeks mesin pencari.
  robots: { index: false, follow: false },
};

type BookingPageProps = {
  params: Promise<{ code: string }>;
};

const STATUS_VIEW: Record<
  BookingStatusValue,
  { icon: typeof Hourglass; note: string; panelClass: string; iconClass: string }
> = {
  PENDING: {
    icon: Hourglass,
    note: "Pesanan sudah kami terima dan sedang menunggu konfirmasi dari admin.",
    panelClass: "border-warning/60 bg-warning/15",
    iconClass: "bg-warning text-warning-foreground",
  },
  CONFIRMED: {
    icon: CircleCheck,
    note: "Pesanan Anda sudah dikonfirmasi. Mohon datang tepat waktu.",
    panelClass: "border-primary/40 bg-primary/10",
    iconClass: "bg-primary text-primary-foreground",
  },
  COMPLETED: {
    icon: BadgeCheck,
    note: "Layanan sudah selesai. Terima kasih atas kunjungan Anda.",
    panelClass: "border-success/40 bg-success/10",
    iconClass: "bg-success text-success-foreground",
  },
  CANCELED: {
    icon: CircleX,
    note: "Pesanan ini sudah dibatalkan. Anda bisa memesan jadwal lain.",
    panelClass: "border-destructive/40 bg-destructive/10",
    iconClass: "bg-destructive text-destructive-foreground",
  },
};

const PROGRESS_STEPS: { status: BookingStatusValue; label: string }[] = [
  { status: "PENDING", label: "Pesanan dibuat" },
  { status: "CONFIRMED", label: "Dikonfirmasi" },
  { status: "COMPLETED", label: "Selesai" },
];

export default async function BookingPage({ params }: BookingPageProps) {
  const { code: rawCode } = await params;
  const code = normalizeBookingCode(rawCode);
  if (!isBookingCodeFormat(code)) notFound();

  const booking = await prisma.booking.findUnique({ where: { code } });
  if (!booking) notFound();

  const timeZone = env.BUSINESS_TIMEZONE;
  const view = STATUS_VIEW[booking.status];
  const StatusIcon = view.icon;
  const currentStep = PROGRESS_STEPS.findIndex((step) => step.status === booking.status);

  // Hanya janjikan notifikasi lewat kanal yang benar-benar aktif dan diisi pelanggan.
  const channels = getNotificationChannels();
  const notifyVia = [
    channels.whatsapp && booking.customerWhatsapp ? "WhatsApp" : null,
    channels.email && booking.customerEmail ? "email" : null,
  ].filter((item): item is string => item !== null);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Status besar di paling atas: hal pertama yang ingin diketahui pelanggan. */}
      <section className={cn("rounded-2xl border p-6", view.panelClass)}>
        <div className="flex items-start gap-4">
          <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-full", view.iconClass)}>
            <StatusIcon className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Status pesanan</p>
            <h1 className="text-2xl font-bold tracking-tight">{BOOKING_STATUS_LABELS[booking.status]}</h1>
            <p className="text-sm">{view.note}</p>
            {booking.status === "PENDING" && notifyVia.length > 0 ? (
              <p className="text-muted-foreground text-sm">
                Kami akan mengabari Anda lewat {notifyVia.join(" dan ")} begitu pesanan dikonfirmasi.
              </p>
            ) : null}
          </div>
        </div>

        {booking.status !== "CANCELED" ? (
          <ol className="mt-6 grid grid-cols-3 gap-2">
            {PROGRESS_STEPS.map((step, index) => {
              const isDone = index <= currentStep;
              return (
                <li key={step.status} className="space-y-2">
                  <div className={cn("h-1.5 rounded-full", isDone ? "bg-primary" : "bg-foreground/15")} />
                  <p
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      isDone ? "font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : null}
                    {step.label}
                  </p>
                </li>
              );
            })}
          </ol>
        ) : null}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{booking.serviceName}</CardTitle>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3">
            <div>
              <p className="text-muted-foreground text-xs">Kode booking</p>
              <p className="font-mono text-lg font-semibold tracking-widest">{booking.code}</p>
            </div>
            <CopyLinkButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="flex items-start gap-3">
              <CalendarDays className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <p className="text-muted-foreground">Tanggal</p>
                <p className="font-medium">{formatDateLong(booking.startAt, timeZone)}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <p className="text-muted-foreground">Jam ({timeZone})</p>
                <p className="font-medium">
                  {formatTime(booking.startAt, timeZone)} - {formatTime(booking.endAt, timeZone)} ·{" "}
                  {formatDuration(booking.serviceDurationMinutes)}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Wallet className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <p className="text-muted-foreground">Harga</p>
                <p className="font-medium">{formatRupiah(booking.servicePrice)}</p>
              </div>
            </li>
          </ul>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-t pt-5 text-sm">
            <dt className="text-muted-foreground">Nama</dt>
            <dd>{booking.customerName}</dd>

            {booking.customerWhatsapp ? (
              <>
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd>+{booking.customerWhatsapp}</dd>
              </>
            ) : null}

            {booking.customerEmail ? (
              <>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="break-all">{booking.customerEmail}</dd>
              </>
            ) : null}

            {booking.notes ? (
              <>
                <dt className="text-muted-foreground">Catatan</dt>
                <dd className="whitespace-pre-wrap">{booking.notes}</dd>
              </>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        Simpan tautan halaman ini atau catat kode booking Anda untuk memeriksa status kapan saja.
      </p>

      <Button asChild variant="outline">
        <Link href="/#layanan">Pesan layanan lain</Link>
      </Button>
    </div>
  );
}
