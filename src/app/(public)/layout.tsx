import type { ReactNode } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/site/brand-mark";
import { Button } from "@/components/ui/button";
import { DAY_NAMES } from "@/lib/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { dayOfWeekFromDateKey, todayDateKey } from "@/lib/time";
import { cn } from "@/lib/utils";

// Footer membaca jam operasional dari database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

// Urutan tampil: Senin ... Sabtu, lalu Minggu.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const hours = await prisma.businessHours.findMany();
  const todayIndex = dayOfWeekFromDateKey(todayDateKey(env.BUSINESS_TIMEZONE));

  const schedule = DISPLAY_ORDER.map((dayOfWeek) => {
    const row = hours.find((item) => item.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      name: DAY_NAMES[dayOfWeek] ?? "",
      label: row && !row.isClosed ? `${row.openTime} - ${row.closeTime}` : "Tutup",
      isToday: dayOfWeek === todayIndex,
    };
  });

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Navbar menempel di atas saat halaman digulir. */}
      <header className="bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
            <BrandMark />
            <span className="truncate">{env.BUSINESS_NAME}</span>
          </Link>
          <nav aria-label="Navigasi utama" className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/#layanan">Layanan</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/#cara-pesan">Cara pesan</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/#cek-pesanan">Cek pesanan</Link>
            </Button>
            <Button asChild size="sm" className="ml-1">
              <Link href="/#layanan">Pesan sekarang</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">{children}</main>

      <footer className="bg-card mt-8 border-t">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 font-semibold tracking-tight">
              <BrandMark />
              <span>{env.BUSINESS_NAME}</span>
            </div>
            <p className="text-muted-foreground max-w-xs text-sm">
              Pesan layanan secara online tanpa antre. Pilih jadwal yang masih kosong dan pantau status
              pesanan Anda kapan saja.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Jam buka</h2>
            <dl className="space-y-1.5 text-sm">
              {schedule.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={cn(
                    "flex justify-between gap-4",
                    day.isToday ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  <dt>
                    {day.name}
                    {day.isToday ? " (hari ini)" : ""}
                  </dt>
                  <dd className="tabular-nums">{day.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Pintasan</h2>
            <ul className="text-muted-foreground space-y-1.5 text-sm">
              <li>
                <Link href="/#layanan" className="hover:text-foreground">
                  Daftar layanan
                </Link>
              </li>
              <li>
                <Link href="/#cara-pesan" className="hover:text-foreground">
                  Cara pesan
                </Link>
              </li>
              <li>
                <Link href="/#cek-pesanan" className="hover:text-foreground">
                  Cek status pesanan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t">
          <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs">
            <span>
              © {new Date().getFullYear()} {env.BUSINESS_NAME}
            </span>
            <span>Semua jam dalam zona waktu {env.BUSINESS_TIMEZONE}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
