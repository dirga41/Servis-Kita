import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { formatDuration, formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Layanan {env.BUSINESS_NAME}</h1>
        <p className="text-muted-foreground text-sm">
          Pilih layanan, lalu tentukan tanggal dan jam yang masih tersedia.
        </p>
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
            <Card key={service.id} className="justify-between">
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                {service.description ? <CardDescription>{service.description}</CardDescription> : null}
              </CardHeader>
              <CardFooter className="justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold">{formatRupiah(service.price)}</p>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {formatDuration(service.durationMinutes)}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/book/${service.id}`}>Pesan</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
