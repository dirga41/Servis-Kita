"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type QuickDate = { dateKey: string; label: string };

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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickDates.map((quickDate) => {
          const isSelected = quickDate.dateKey === selectedDateKey;
          return (
            <Link
              key={quickDate.dateKey}
              href={`${basePath}?date=${quickDate.dateKey}`}
              scroll={false}
              aria-current={isSelected ? "date" : undefined}
              className={cn(buttonVariants({ variant: isSelected ? "default" : "outline", size: "sm" }), "shrink-0")}
            >
              {quickDate.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="booking-date">Tanggal lain</Label>
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
