import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Wallet } from "lucide-react";

import { BookingForm } from "@/components/booking/booking-form";
import { DatePicker, type QuickDate } from "@/components/booking/date-picker";
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

function toQuickDate(dateKey: string, index: number): QuickDate {
  // formatDateKeyShort menghasilkan "Sab, 3 Okt".
  const [weekday, day] = formatDateKeyShort(dateKey).split(", ");
  return {
    dateKey,
    weekday: index === 0 ? "Hari ini" : (weekday ?? ""),
    day: day ?? dateKey,
  };
}

function StepBadge({ number }: { number: number }) {
  return (
    <span className="bg-primary text-primary-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
      {number}
    </span>
  );
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

  const quickDates = Array.from({ length: QUICK_DATE_COUNT }, (_, index) =>
    toQuickDate(addDaysToDateKey(minDateKey, index), index),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/#layanan"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Ganti layanan
      </Link>

      {/* Ringkasan layanan yang dipilih */}
      <section className="bg-card border-l-primary rounded-2xl border border-l-4 p-6 shadow-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Layanan dipilih</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{service.name}</h1>
        {service.description ? (
          <p className="text-muted-foreground mt-1 text-sm">{service.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium">
          <span className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1">
            <Clock className="size-4" aria-hidden="true" />
            {formatDuration(service.durationMinutes)}
          </span>
          <span className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1">
            <Wallet className="size-4" aria-hidden="true" />
            {formatRupiah(service.price)}
          </span>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <StepBadge number={1} />
            Pilih tanggal
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <StepBadge number={2} />
            Pilih jam dan isi data
          </CardTitle>
          <CardDescription>
            {formatDateKeyLong(dateKey)} · zona waktu {env.BUSINESS_TIMEZONE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm
            key={dateKey}
            serviceId={service.id}
            dateLabel={formatDateKeyLong(dateKey)}
            slots={availability.slots}
            unavailableMessage={unavailableMessage(availability)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
