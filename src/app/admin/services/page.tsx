import type { Metadata } from "next";

import { ServiceActiveSwitch } from "@/components/admin/service-active-switch";
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminPage } from "@/lib/auth-guard";
import { formatDuration, formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Membaca database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Layanan",
};

export default async function AdminServicesPage() {
  await requireAdminPage();

  const services = await prisma.service.findMany({
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Layanan</h1>
          <p className="text-muted-foreground text-sm">
            Layanan nonaktif tidak tampil di katalog, tetapi riwayat pesanannya tetap tersimpan.
          </p>
        </div>
        <ServiceFormDialog />
      </div>

      <Card>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada layanan. Tambahkan layanan pertama Anda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="font-medium">{service.name}</div>
                      {service.description ? (
                        <div className="text-muted-foreground max-w-80 text-xs">{service.description}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDuration(service.durationMinutes)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatRupiah(service.price)}</TableCell>
                    <TableCell>
                      <ServiceActiveSwitch
                        serviceId={service.id}
                        serviceName={service.name}
                        isActive={service.isActive}
                      />
                    </TableCell>
                    <TableCell>
                      <ServiceFormDialog
                        service={{
                          id: service.id,
                          name: service.name,
                          description: service.description ?? "",
                          durationMinutes: service.durationMinutes,
                          price: service.price,
                          isActive: service.isActive,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
