import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, Clock, ListChecks } from "lucide-react";

import { BookingLookup } from "@/components/booking/booking-lookup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { formatDuration, formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { dayOfWeekFromDateKey, formatDateKeyLong, todayDateKey } from "@/lib/time";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: ListChecks,
    title: "Pilih layanan",
    description: "Durasi dan harganya sudah tertulis, jadi tidak ada kejutan di kasir.",
  },
  {
    icon: CalendarClock,
    title: "Pilih tanggal dan jam",
    description: "Yang muncul hanya jam yang benar-benar masih kosong.",
  },
  {
    icon: BellRing,
    title: "Simpan kode booking",
    description: "Pakai kodenya untuk mengecek apakah pesanan sudah dikonfirmasi.",
  },
];

export default async function CatalogPage() {
  const todayKey = todayDateKey(env.BUSINESS_TIMEZONE);

  const [services, todayHours] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    }),
    prisma.businessHours.findUnique({ where: { dayOfWeek: dayOfWeekFromDateKey(todayKey) } }),
  ]);

  const isOpenToday = Boolean(todayHours && !todayHours.isClosed);

  return (
    <div className="space-y-14">
      {/* Hero: latar putih bersih, tanpa gradien. */}
      <section className="bg-card grid gap-8 rounded-2xl border p-6 shadow-sm sm:p-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
        <div className="space-y-5">
          <p className="bg-accent text-accent-foreground inline-flex rounded-full px-3 py-1 text-xs font-medium">
            Booking online · tanpa perlu membuat akun
          </p>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
            Pilih jamnya, tinggal datang.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
            Lihat jam yang masih kosong di {env.BUSINESS_NAME}, pesan dari ponsel, lalu pantau statusnya
            lewat kode booking.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg">
              <Link href="#layanan">
                Lihat layanan
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#cek-pesanan">Cek pesanan saya</Link>
            </Button>
          </div>
        </div>

        {/* Info nyata dari database: jam buka hari ini. */}
        <div className="bg-background rounded-xl border p-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Hari ini</p>
          <p className="mt-1 text-sm font-medium">{formatDateKeyLong(todayKey)}</p>
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden="true"
              className={isOpenToday ? "bg-success size-2.5 rounded-full" : "bg-destructive size-2.5 rounded-full"}
            />
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {todayHours && !todayHours.isClosed ? `${todayHours.openTime} - ${todayHours.closeTime}` : "Tutup"}
            </p>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {isOpenToday
              ? "Jam yang masih bisa dipesan terlihat setelah memilih layanan."
              : "Hari ini kami tutup, tapi jadwal hari lain tetap bisa dipesan."}
          </p>
        </div>
      </section>

      {/* Cara pesan */}
      <section id="cara-pesan" aria-labelledby="cara-pesan-title" className="space-y-5">
        <div className="space-y-1">
          <h2 id="cara-pesan-title" className="text-2xl font-bold tracking-tight">
            Cara pesan
          </h2>
          <p className="text-muted-foreground text-sm">Tiga langkah, cukup dari ponsel.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="bg-card rounded-xl border p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="bg-primary text-primary-foreground inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums">
                  {index + 1}
                </span>
                <step.icon className="text-muted-foreground size-5" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Layanan */}
      <section id="layanan" aria-labelledby="layanan-title" className="space-y-5">
        <div className="space-y-1">
          <h2 id="layanan-title" className="text-2xl font-bold tracking-tight">
            Pilih layanan
          </h2>
          <p className="text-muted-foreground text-sm">Durasi dan harga tertera di setiap layanan.</p>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground text-sm">Belum ada layanan yang tersedia saat ini.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <Card
                key={service.id}
                className="hover:border-primary/50 justify-between transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <span className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>
                  {service.description ? <CardDescription>{service.description}</CardDescription> : null}
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-3">
                  <p className="text-2xl font-bold tracking-tight">{formatRupiah(service.price)}</p>
                  <Button asChild>
                    <Link href={`/book/${service.id}`}>
                      Pilih jadwal
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Cek pesanan */}
      <section id="cek-pesanan" aria-labelledby="cek-pesanan-title">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle id="cek-pesanan-title" className="text-lg">
              Sudah pesan? Cek statusnya
            </CardTitle>
            <CardDescription>
              Masukkan kode booking yang muncul setelah memesan untuk melihat apakah jadwal Anda sudah
              dikonfirmasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingLookup />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
