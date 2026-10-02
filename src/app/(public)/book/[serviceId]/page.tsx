import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking/booking-form";
import { DatePicker } from "@/components/booking/date-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { formatDuration, formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getBookingWindow, getDayAvailability } from "@/lib/slots";
import { addDaysToDateKey, formatDateKeyLong, formatDateKeyShort, isValidDateKey } from "@/lib/time";
import type { DayAvailability } from "@/types";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pilih jadwal",
};

const QUICK_DATE_COUNT = 14;

type BookPageProps = {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};

function unavailableMessage(availability: DayAvailability): string | null {
  switch (availability.status) {
    case "OPEN":
      return null;
    case "HOLIDAY":
      return availability.holidayDescription
        ? `Tutup pada tanggal ini (${availability.holidayDescription}). Silakan pilih tanggal lain.`
        : "Tutup pada tanggal ini (hari libur). Silakan pilih tanggal lain.";
    case "CLOSED":
      return "Tutup pada hari ini. Silakan pilih tanggal lain.";
    case "FULL":
      return "Tidak ada slot tersisa pada tanggal ini. Silakan pilih tanggal lain.";
    case "OUT_OF_RANGE":
      return "Tanggal ini di luar rentang pemesanan. Silakan pilih tanggal lain.";
  }
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { serviceId } = await params;
  const query = await searchParams;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, isActive: true },
  });
  if (!service) notFound();

  const { minDateKey, maxDateKey } = getBookingWindow();
  const requestedDate = typeof query.date === "string" ? query.date : undefined;
  const dateKey =
    requestedDate &&
    isValidDateKey(requestedDate) &&
    requestedDate >= minDateKey &&
    requestedDate <= maxDateKey
      ? requestedDate
      : minDateKey;

  const availability = await getDayAvailability({
    dateKey,
    durationMinutes: service.durationMinutes,
  });

  const quickDates = Array.from({ length: QUICK_DATE_COUNT }, (_, index) => {
    const key = addDaysToDateKey(minDateKey, index);
    return { dateKey: key, label: formatDateKeyShort(key) };
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/" className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
          Semua layanan
        </Link>
        <h1 className="text-2xl font-semibold">{service.name}</h1>
        <p className="text-muted-foreground text-sm">
          {formatDuration(service.durationMinutes)} · {formatRupiah(service.price)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Pilih tanggal</CardTitle>
          <CardDescription>Pemesanan dibuka sampai {formatDateKeyLong(maxDateKey)}.</CardDescription>
        </CardHeader>
        <CardContent>
          <DatePicker
            basePath={`/book/${service.id}`}
            selectedDateKey={dateKey}
            minDateKey={minDateKey}
            maxDateKey={maxDateKey}
            quickDates={quickDates}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Pilih jam dan isi data</CardTitle>
          <CardDescription>
            {formatDateKeyLong(dateKey)} · zona waktu {env.BUSINESS_TIMEZONE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm
            key={dateKey}
            serviceId={service.id}
            slots={availability.slots}
            unavailableMessage={unavailableMessage(availability)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
