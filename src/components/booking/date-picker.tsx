"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type QuickDate = {
  dateKey: string;
  /** Mis. "Sab" atau "Hari ini". */
  weekday: string;
  /** Mis. "3 Okt". */
  day: string;
};

type DatePickerProps = {
  basePath: string;
  selectedDateKey: string;
  minDateKey: string;
  maxDateKey: string;
  quickDates: QuickDate[];
};

export function DatePicker({ basePath, selectedDateKey, minDateKey, maxDateKey, quickDates }: DatePickerProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-2">
        {quickDates.map((quickDate) => {
          const isSelected = quickDate.dateKey === selectedDateKey;
          return (
            <Link
              key={quickDate.dateKey}
              href={`${basePath}?date=${quickDate.dateKey}`}
              scroll={false}
              aria-current={isSelected ? "date" : undefined}
              className={cn(
                "focus-visible:ring-ring/50 flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 text-center transition-all duration-200 ease-in-out outline-none focus-visible:ring-[3px]",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "bg-card hover:border-primary/50 hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5",
              )}
            >
              <span className={cn("text-xs", isSelected ? "opacity-90" : "text-muted-foreground")}>
                {quickDate.weekday}
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">{quickDate.day}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="booking-date" className="text-muted-foreground font-normal">
          Atau pilih tanggal lain
        </Label>
        <Input
          id="booking-date"
          type="date"
          className="w-auto"
          min={minDateKey}
          max={maxDateKey}
          value={selectedDateKey}
          onChange={(event) => {
            const nextDate = event.target.value;
            if (nextDate) {
              router.push(`${basePath}?date=${nextDate}`, { scroll: false });
            }
          }}
        />
      </div>
    </div>
  );
}
