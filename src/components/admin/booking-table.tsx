import { StatusActions } from "@/components/admin/status-actions";
import { StatusBadge } from "@/components/booking/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BookingStatusValue } from "@/lib/constants";
import { formatRupiah, whatsappLink } from "@/lib/format";

export type BookingRow = {
  id: string;
  code: string;
  customerName: string;
  customerWhatsapp: string | null;
  customerEmail: string | null;
  serviceName: string;
  servicePrice: number;
  notes: string | null;
  status: BookingStatusValue;
  /** Sudah diformat di server dalam zona waktu bisnis. */
  dateLabel: string;
  timeLabel: string;
};

type BookingTableProps = {
  rows: BookingRow[];
  showDate: boolean;
  emptyMessage: string;
};

export function BookingTable({ rows, showDate, emptyMessage }: BookingTableProps) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Pelanggan</TableHead>
          <TableHead>Layanan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap">
              <div className="font-medium">{row.timeLabel}</div>
              {showDate ? <div className="text-muted-foreground text-xs">{row.dateLabel}</div> : null}
            </TableCell>
            <TableCell>
              <div className="font-medium">{row.customerName}</div>
              <div className="text-muted-foreground space-y-0.5 text-xs">
                {row.customerWhatsapp ? (
                  <div>
                    <a
                      href={whatsappLink(row.customerWhatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground underline underline-offset-2"
                    >
                      WA +{row.customerWhatsapp}
                    </a>
                  </div>
                ) : null}
                {row.customerEmail ? (
                  <div>
                    <a
                      href={`mailto:${row.customerEmail}`}
                      className="hover:text-foreground underline underline-offset-2"
                    >
                      {row.customerEmail}
                    </a>
                  </div>
                ) : null}
                {row.notes ? <div className="max-w-64 whitespace-pre-wrap">Catatan: {row.notes}</div> : null}
              </div>
            </TableCell>
            <TableCell>
              <div>{row.serviceName}</div>
              <div className="text-muted-foreground text-xs">{formatRupiah(row.servicePrice)}</div>
              <div className="text-muted-foreground font-mono text-xs">{row.code}</div>
            </TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>
              <StatusActions bookingId={row.id} status={row.status} customerName={row.customerName} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
