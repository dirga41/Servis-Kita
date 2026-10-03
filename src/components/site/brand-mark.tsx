import { CalendarCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/** Logo kecil bergradien yang dipakai di navbar pelanggan, admin, dan halaman login. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-brand-gradient inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
        className,
      )}
    >
      <CalendarCheck className="size-4" />
    </span>
  );
}
