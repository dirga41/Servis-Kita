import type { Metadata } from "next";

import { BusinessHoursForm } from "@/components/admin/business-hours-form";
import { HolidayManager } from "@/components/admin/holiday-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/auth-guard";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { dateKeyToDbDate, dbDateToDateKey, formatDateKeyLong, todayDateKey } from "@/lib/time";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jadwal",
};

// Urutan tampil: Senin ... Sabtu, lalu Minggu.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminSchedulePage() {
  await requireAdminPage();

  const today = todayDateKey(env.BUSINESS_TIMEZONE);

  const [hours, holidays] = await Promise.all([
    prisma.businessHours.findMany(),
    prisma.holiday.findMany({
      where: { date: { gte: dateKeyToDbDate(today) } },
      orderBy: { date: "asc" },
    }),
  ]);

  // Jika seed belum dijalankan, hari yang belum punya baris dianggap tutup.
  const days = DISPLAY_ORDER.map((dayOfWeek) => {
    const row = hours.find((item) => item.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      openTime: row?.openTime ?? "09:00",
      closeTime: row?.closeTime ?? "17:00",
      isClosed: row?.isClosed ?? true,
    };
  });

  const holidayItems = holidays.map((holiday) => ({
    id: holiday.id,
    dateLabel: formatDateKeyLong(dbDateToDateKey(holiday.date)),
    description: holiday.description,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Jadwal</h1>
        <p className="text-muted-foreground text-sm">
          Jam dalam zona waktu {env.BUSINESS_TIMEZONE}. Slot pelanggan dihitung dari pengaturan ini.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jam operasional mingguan</CardTitle>
          <CardDescription>Matikan sakelar untuk hari tutup mingguan.</CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessHoursForm days={days} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hari libur</CardTitle>
          <CardDescription>Tanggal tertentu saat bisnis tutup, di luar jadwal mingguan.</CardDescription>
        </CardHeader>
        <CardContent>
          <HolidayManager holidays={holidayItems} minDateKey={today} />
        </CardContent>
      </Card>
    </div>
  );
}
