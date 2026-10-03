"use client";

import { useState, useTransition } from "react";

import { updateBookingStatusAction } from "@/actions/admin-bookings";
import { Button } from "@/components/ui/button";
import { BOOKING_STATUS_TRANSITIONS, type BookingStatusValue } from "@/lib/constants";
import type { NotificationOutcome } from "@/types";

const ACTION_LABELS: Record<BookingStatusValue, string> = {
  PENDING: "Tandai menunggu",
  CONFIRMED: "Konfirmasi",
  COMPLETED: "Selesai",
  CANCELED: "Batalkan",
};

/** Warna tombol mengikuti status tujuannya. */
const ACTION_CLASSES: Record<BookingStatusValue, string> = {
  PENDING: "",
  CONFIRMED: "",
  COMPLETED: "bg-success text-success-foreground hover:bg-success/85",
  CANCELED: "border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive",
};

type Feedback = { tone: "info" | "error"; text: string };

function describeNotifications(outcome: NotificationOutcome): Feedback | null {
  const sent: string[] = [];
  const failed: string[] = [];
  if (outcome.email === "sent") sent.push("email");
  if (outcome.email === "failed") failed.push("email");
  if (outcome.whatsapp === "sent") sent.push("WhatsApp");
  if (outcome.whatsapp === "failed") failed.push("WhatsApp");

  if (failed.length > 0) {
    const sentPart = sent.length > 0 ? ` Terkirim lewat ${sent.join(" dan ")}.` : "";
    return {
      tone: "error",
      text: `Status tersimpan, tetapi notifikasi ${failed.join(" dan ")} gagal terkirim.${sentPart}`,
    };
  }
  if (sent.length > 0) {
    return { tone: "info", text: `Pelanggan sudah diberi tahu lewat ${sent.join(" dan ")}.` };
  }
  return null;
}

type StatusActionsProps = {
  bookingId: string;
  status: BookingStatusValue;
  customerName: string;
};

export function StatusActions({ bookingId, status, customerName }: StatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const nextStatuses = BOOKING_STATUS_TRANSITIONS[status];

  function changeStatus(nextStatus: BookingStatusValue) {
    if (nextStatus === "CANCELED" && !window.confirm(`Batalkan pesanan atas nama ${customerName}?`)) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await updateBookingStatusAction({ bookingId, status: nextStatus });
      if (!result.ok) {
        setFeedback({ tone: "error", text: result.error });
        return;
      }
      setFeedback(describeNotifications(result.data.notifications));
    });
  }

  return (
    <div className="space-y-1">
      {nextStatuses.length === 0 ? (
        <span className="text-muted-foreground text-sm">-</span>
      ) : (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((nextStatus) => (
            <Button
              key={nextStatus}
              size="sm"
              variant={nextStatus === "CANCELED" ? "outline" : "default"}
              className={ACTION_CLASSES[nextStatus]}
              disabled={isPending}
              onClick={() => changeStatus(nextStatus)}
            >
              {isPending ? "Memproses..." : ACTION_LABELS[nextStatus]}
            </Button>
          ))}
        </div>
      )}
      {feedback ? (
        <p
          role="status"
          className={
            feedback.tone === "error"
              ? "text-destructive max-w-56 text-xs"
              : "text-muted-foreground max-w-56 text-xs"
          }
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
