import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/booking/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isBookingCodeFormat, normalizeBookingCode } from "@/lib/booking-code";
import { env } from "@/lib/env";
import { formatDuration, formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { formatDateLong, formatTime } from "@/lib/time";

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

const STATUS_NOTES = {
  PENDING: "Pesanan Anda sudah kami terima dan sedang menunggu konfirmasi dari admin.",
  CONFIRMED: "Pesanan Anda sudah dikonfirmasi. Mohon datang tepat waktu.",
  COMPLETED: "Layanan sudah selesai. Terima kasih atas kunjungan Anda.",
  CANCELED: "Pesanan ini sudah dibatalkan.",
} as const;

export default async function BookingPage({ params }: BookingPageProps) {
  const { code: rawCode } = await params;
  const code = normalizeBookingCode(rawCode);
  if (!isBookingCodeFormat(code)) notFound();

  const booking = await prisma.booking.findUnique({ where: { code } });
  if (!booking) notFound();

  const timeZone = env.BUSINESS_TIMEZONE;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Detail pesanan</h1>
        <p className="text-muted-foreground text-sm">
          Simpan tautan halaman ini untuk memeriksa status pesanan Anda kapan saja.
        </p>
      </div>

      <Alert variant={booking.status === "CANCELED" ? "destructive" : "default"}>
        <div className="space-y-1">
          <AlertTitle>Status: <StatusBadge status={booking.status} /></AlertTitle>
          <AlertDescription>{STATUS_NOTES[booking.status]}</AlertDescription>
        </div>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{booking.serviceName}</CardTitle>
          <CardDescription>
            Kode booking: <span className="text-foreground font-mono font-medium">{booking.code}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Tanggal</dt>
            <dd>{formatDateLong(booking.startAt, timeZone)}</dd>

            <dt className="text-muted-foreground">Jam</dt>
            <dd>
              {formatTime(booking.startAt, timeZone)} - {formatTime(booking.endAt, timeZone)} ({timeZone})
            </dd>

            <dt className="text-muted-foreground">Durasi</dt>
            <dd>{formatDuration(booking.serviceDurationMinutes)}</dd>

            <dt className="text-muted-foreground">Harga</dt>
            <dd>{formatRupiah(booking.servicePrice)}</dd>

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

      <Button asChild variant="outline">
        <Link href="/">Pesan layanan lain</Link>
      </Button>
    </div>
  );
}
