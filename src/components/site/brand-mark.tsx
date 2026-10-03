import { cn } from "@/lib/utils";

/**
 * Logo vektor: tanda centang di dalam lingkaran terbuka (jadwal yang sudah
 * beres). Warnanya mengikuti variabel tema, jadi otomatis menyesuaikan tema
 * terang dan gelap.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path
        d="M22.6 11.3A8 8 0 1 0 24 16"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M11.8 16.2l3.1 3.1 8.3-8.6"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
