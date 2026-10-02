import type { Booking } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { BookingTable, type BookingRow } from "@/components/admin/booking-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdminPage } from "@/lib/auth-guard";
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES } from "@/lib/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  addDaysToDateKey,
  formatDateKeyLong,
  formatDateLong,
  formatTime,
  getDayRangeUtc,
  isValidDateKey,
  todayDateKey,
} from "@/lib/time";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dasbor",
};

const PENDING_LIST_LIMIT = 50;

type AdminDashboardPageProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

function toBookingRow(booking: Booking, timeZone: string): BookingRow {
  return {
    id: booking.id,
    code: booking.code,
    customerName: booking.customerName,
    customerWhatsapp: booking.customerWhatsapp,
    customerEmail: booking.customerEmail,
    serviceName: booking.serviceName,
    servicePrice: booking.servicePrice,
    notes: booking.notes,
    status: booking.status,
    dateLabel: formatDateLong(booking.startAt, timeZone),
    timeLabel: `${formatTime(booking.startAt, timeZone)} - ${formatTime(booking.endAt, timeZone)}`,
  };
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireAdminPage();

  const timeZone = env.BUSINESS_TIMEZONE;
  const query = await searchParams;
  const today = todayDateKey(timeZone);
  const requestedDate = typeof query.date === "string" ? query.date : undefined;
  const dateKey = requestedDate && isValidDateKey(requestedDate) ? requestedDate : today;
  const isToday = dateKey === today;
  const { start, end } = getDayRangeUtc(dateKey, timeZone);

  const [statusCounts, dayBookings, pendingBookings] = await Promise.all([
    Promise.all(BOOKING_STATUSES.map((status) => prisma.booking.count({ where: { status } }))),
    prisma.booking.findMany({
      where: { startAt: { gte: start, lt: end } },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { status: "PENDING", startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: PENDING_LIST_LIMIT,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Dasbor</h1>
        <p className="text-muted-foreground text-sm">Semua jam ditampilkan dalam zona waktu {timeZone}.</p>
      </div>

      <section aria-label="Jumlah pesanan per status" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {BOOKING_STATUSES.map((status, index) => (
          <Card key={status} className="gap-2">
            <CardHeader>
              <CardDescription>{BOOKING_STATUS_LABELS[status]}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{statusCounts[index]}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{isToday ? "Jadwal hari ini" : "Jadwal"}</CardTitle>
          <CardDescription>{formatDateKeyLong(dateKey)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin?date=${addDaysToDateKey(dateKey, -1)}`}>Sebelumnya</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Hari ini</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin?date=${addDaysToDateKey(dateKey, 1)}`}>Berikutnya</Link>
            </Button>
            <form method="get" action="/admin" className="flex items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="dashboard-date" className="sr-only">
                  Pilih tanggal
                </Label>
                <Input
                  id="dashboard-date"
                  type="date"
                  name="date"
                  defaultValue={dateKey}
                  className="h-8 w-auto"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Lihat
              </Button>
            </form>
          </div>

          <BookingTable
            rows={dayBookings.map((booking) => toBookingRow(booking, timeZone))}
            showDate={false}
            emptyMessage="Belum ada pesanan pada tanggal ini."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menunggu konfirmasi</CardTitle>
          <CardDescription>Pesanan mendatang yang belum dikonfirmasi, dari yang paling dekat.</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingTable
            rows={pendingBookings.map((booking) => toBookingRow(booking, timeZone))}
            showDate
            emptyMessage="Tidak ada pesanan yang menunggu konfirmasi."
          />
        </CardContent>
      </Card>
    </div>
  );
}
