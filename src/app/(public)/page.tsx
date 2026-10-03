import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, Clock, ListChecks, Sparkles } from "lucide-react";

import { BookingLookup } from "@/components/booking/booking-lookup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { formatDuration, formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: ListChecks,
    title: "Pilih layanan",
    description: "Lihat durasi dan harga, lalu pilih layanan yang Anda butuhkan.",
  },
  {
    icon: CalendarClock,
    title: "Pilih tanggal dan jam",
    description: "Hanya jam yang masih kosong yang ditampilkan, jadi tidak perlu tanya dulu.",
  },
  {
    icon: BellRing,
    title: "Tunggu konfirmasi",
    description: "Anda mendapat kode booking untuk memantau status pesanan kapan saja.",
  },
];

export default async function CatalogPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="bg-brand-gradient relative overflow-hidden rounded-2xl px-6 py-12 text-white shadow-lg sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-16 size-72 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative max-w-2xl space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Booking online, tanpa perlu membuat akun
          </p>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
            Pesan jadwal di {env.BUSINESS_NAME} tanpa antre
          </h1>
          <p className="max-w-xl text-base text-white/85 sm:text-lg">
            Pilih layanan, tentukan jam yang masih kosong, dan datang sesuai jadwal. Cukup dari
            ponsel Anda.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="bg-white text-neutral-900 hover:bg-white/90">
              <Link href="#layanan">
                Lihat layanan
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="#cek-pesanan">Cek pesanan saya</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cara pesan */}
      <section id="cara-pesan" aria-labelledby="cara-pesan-title" className="space-y-5">
        <div className="space-y-1">
          <h2 id="cara-pesan-title" className="text-2xl font-bold tracking-tight">
            Cara pesan
          </h2>
          <p className="text-muted-foreground text-sm">Tiga langkah, selesai dari ponsel Anda.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="bg-card relative rounded-xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="bg-accent text-accent-foreground inline-flex size-10 items-center justify-center rounded-lg">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-muted-foreground/40 text-3xl font-bold tabular-nums">{index + 1}</span>
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
                className="hover:border-primary/50 justify-between transition-shadow hover:shadow-md"
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
              Masukkan kode booking yang Anda terima setelah memesan untuk melihat apakah pesanan sudah
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
