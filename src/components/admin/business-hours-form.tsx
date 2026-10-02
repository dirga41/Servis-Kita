"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { saveBusinessHoursAction } from "@/actions/schedule";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DAY_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { businessHoursFormSchema, type BusinessHoursFormValues } from "@/lib/validations";

type BusinessHoursFormProps = {
  /** Tepat 7 hari, sudah diurutkan sesuai urutan tampil. */
  days: BusinessHoursFormValues["days"];
};

type FormMessage = { type: "success" | "error"; text: string };

export function BusinessHoursForm({ days }: BusinessHoursFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<FormMessage | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<BusinessHoursFormValues>({
    resolver: zodResolver(businessHoursFormSchema),
    defaultValues: { days },
  });

  const watchedDays = watch("days");
  // Error tingkat daftar (mis. jumlah hari tidak 7), bukan milik satu baris.
  const listError = errors.days?.root?.message ?? errors.days?.message;

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveBusinessHoursAction(values);
      setMessage(
        result.ok
          ? { type: "success", text: "Jam operasional tersimpan." }
          : { type: "error", text: result.error },
      );
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {message ? (
        <Alert variant={message.type === "success" ? "success" : "destructive"}>
          {message.type === "success" ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}

      <div className="divide-y">
        {days.map((day, index) => {
          const isClosed = watchedDays[index]?.isClosed ?? day.isClosed;
          const rowErrors = errors.days?.[index];
          const dayName = DAY_NAMES[day.dayOfWeek] ?? `Hari ${day.dayOfWeek}`;
          const rowError = rowErrors?.openTime?.message ?? rowErrors?.closeTime?.message;

          return (
            <div key={day.dayOfWeek} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="w-20 text-sm font-medium">{dayName}</span>

                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`days.${index}.isClosed`}
                    render={({ field }) => (
                      <Switch
                        id={`day-${day.dayOfWeek}-open`}
                        checked={!field.value}
                        onCheckedChange={(checked) => field.onChange(!checked)}
                        disabled={isPending}
                      />
                    )}
                  />
                  <Label htmlFor={`day-${day.dayOfWeek}-open`} className="w-12 font-normal">
                    {isClosed ? "Tutup" : "Buka"}
                  </Label>
                </div>

                {/* Input tidak di-disable saat tutup, karena React Hook Form
                    membuang nilai input yang disabled. */}
                <div className={cn("flex items-center gap-2", isClosed ? "opacity-50" : undefined)}>
                  <Label htmlFor={`day-${day.dayOfWeek}-open-time`} className="sr-only">
                    Jam buka {dayName}
                  </Label>
                  <Input
                    id={`day-${day.dayOfWeek}-open-time`}
                    type="time"
                    className="w-auto"
                    aria-invalid={rowErrors?.openTime ? true : undefined}
                    {...register(`days.${index}.openTime`)}
                  />
                  <span className="text-muted-foreground text-sm">sampai</span>
                  <Label htmlFor={`day-${day.dayOfWeek}-close-time`} className="sr-only">
                    Jam tutup {dayName}
                  </Label>
                  <Input
                    id={`day-${day.dayOfWeek}-close-time`}
                    type="time"
                    className="w-auto"
                    aria-invalid={rowErrors?.closeTime ? true : undefined}
                    {...register(`days.${index}.closeTime`)}
                  />
                </div>
              </div>
              {rowError ? <p className="text-destructive text-sm">{rowError}</p> : null}
            </div>
          );
        })}
      </div>

      {listError ? <p className="text-destructive text-sm">{listError}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
        {isPending ? "Menyimpan..." : "Simpan jam operasional"}
      </Button>
    </form>
  );
}
