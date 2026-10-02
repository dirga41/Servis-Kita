import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { BOOKING_STATUS_LABELS, type BookingStatusValue } from "@/lib/constants";

const STATUS_VARIANTS: Record<BookingStatusValue, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "default",
  COMPLETED: "success",
  CANCELED: "destructive",
};

export function StatusBadge({ status }: { status: BookingStatusValue }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}
