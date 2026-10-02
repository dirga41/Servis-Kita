"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, LoaderCircle, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { addHolidayAction, deleteHolidayAction } from "@/actions/schedule";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { holidayFormSchema, type HolidayFormValues } from "@/lib/validations";

export type HolidayItem = {
  id: string;
  /** Sudah diformat di server, mis. "Jumat, 25 Desember 2026". */
  dateLabel: string;
  description: string | null;
};

type HolidayManagerProps = {
  holidays: HolidayItem[];
  minDateKey: string;
};

type FormMessage = { type: "success" | "warning" | "error"; text: string };

const MESSAGE_VARIANTS = {
  success: "success",
  warning: "warning",
  error: "destructive",
} as const;

export function HolidayManager({ holidays, minDateKey }: HolidayManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<FormMessage | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: { date: "", description: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = await addHolidayAction(values);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      reset();
      setMessage(
        result.data.activeBookings > 0
          ? {
              type: "warning",
              text: `Hari libur ditambahkan. Ada ${result.data.activeBookings} pesanan aktif pada tanggal itu yang tidak dibatalkan otomatis; hubungi pelanggan dan batalkan dari dasbor bila perlu.`,
            }
          : { type: "success", text: "Hari libur ditambahkan." },
      );
    });
  });

  function handleDelete(holiday: HolidayItem) {
    if (!window.confirm(`Hapus hari libur ${holiday.dateLabel}?`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteHolidayAction(holiday.id);
      setMessage(
        result.ok ? { type: "success", text: "Hari libur dihapus." } : { type: "error", text: result.error },
      );
    });
  }

  return (
    <div className="space-y-6">
      {message ? (
        <Alert variant={MESSAGE_VARIANTS[message.type]}>
          {message.type === "success" ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
        <div className="space-y-2">
          <Label htmlFor="holiday-date">Tanggal</Label>
          <Input
            id="holiday-date"
            type="date"
            min={minDateKey}
            aria-invalid={errors.date ? true : undefined}
            disabled={isPending}
            {...register("date")}
          />
          {errors.date ? <p className="text-destructive text-sm">{errors.date.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="holiday-description">Keterangan (opsional)</Label>
          <Input
            id="holiday-description"
            placeholder="Mis. Libur Lebaran"
            aria-invalid={errors.description ? true : undefined}
            disabled={isPending}
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-destructive text-sm">{errors.description.message}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={isPending} className="sm:mt-[1.375rem]">
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          Tambah
        </Button>
      </form>

      {holidays.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada hari libur mendatang.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {holidays.map((holiday) => (
            <li key={holiday.id} className="flex items-center justify-between gap-4 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{holiday.dateLabel}</p>
                {holiday.description ? (
                  <p className="text-muted-foreground truncate text-xs">{holiday.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleDelete(holiday)}
                aria-label={`Hapus hari libur ${holiday.dateLabel}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
