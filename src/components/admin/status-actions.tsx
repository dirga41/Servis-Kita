"use client";

import { useState, useTransition } from "react";

import { updateBookingStatusAction } from "@/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { BOOKING_STATUS_TRANSITIONS, type BookingStatusValue } from "@/lib/constants";

const ACTION_LABELS: Record<BookingStatusValue, string> = {
  PENDING: "Tandai menunggu",
  CONFIRMED: "Konfirmasi",
  COMPLETED: "Selesai",
  CANCELED: "Batalkan",
};

type StatusActionsProps = {
  bookingId: string;
  status: BookingStatusValue;
  customerName: string;
};

export function StatusActions({ bookingId, status, customerName }: StatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = BOOKING_STATUS_TRANSITIONS[status];
  if (nextStatuses.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  function changeStatus(nextStatus: BookingStatusValue) {
    if (nextStatus === "CANCELED" && !window.confirm(`Batalkan pesanan atas nama ${customerName}?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatusAction({ bookingId, status: nextStatus });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((nextStatus) => (
          <Button
            key={nextStatus}
            size="sm"
            variant={nextStatus === "CANCELED" ? "outline" : "default"}
            disabled={isPending}
            onClick={() => changeStatus(nextStatus)}
          >
            {ACTION_LABELS[nextStatus]}
          </Button>
        ))}
      </div>
      {error ? <p className="text-destructive max-w-56 text-xs">{error}</p> : null}
    </div>
  );
}
