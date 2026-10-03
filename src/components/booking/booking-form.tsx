"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck, CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { createBookingAction } from "@/actions/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { bookingFormSchema, type BookingFormValues } from "@/lib/validations";
import type { Slot } from "@/types";

type BookingFormProps = {
  serviceId: string;
  /** Tanggal terpilih yang sudah diformat, mis. "Sabtu, 3 Oktober 2026". */
  dateLabel: string;
  slots: Slot[];
  /** Diisi jika tanggal yang dipilih tidak bisa dipesan (tutup, libur, penuh). */
  unavailableMessage: string | null;
};

const SLOT_GROUPS = [
  { title: "Pagi", fromHour: 0, toHour: 11 },
  { title: "Siang", fromHour: 11, toHour: 15 },
  { title: "Sore", fromHour: 15, toHour: 18 },
  { title: "Malam", fromHour: 18, toHour: 24 },
];

function groupSlots(slots: Slot[]): { title: string; slots: Slot[] }[] {
  return SLOT_GROUPS.map((group) => ({
    title: group.title,
    slots: slots.filter((slot) => {
      const hour = Number(slot.label.slice(0, 2));
      return hour >= group.fromHour && hour < group.toHour;
    }),
  })).filter((group) => group.slots.length > 0);
}

export function BookingForm({ serviceId, dateLabel, slots, unavailableMessage }: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId,
      startAt: "",
      customerName: "",
      customerWhatsapp: "",
      customerEmail: "",
      notes: "",
    },
  });

  const selectedStartAt = watch("startAt");
  const selectedSlot = slots.find((slot) => slot.startAt === selectedStartAt);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createBookingAction(values);
      if (!result.ok) {
        setFormError(result.error);
        // Slot mungkin baru saja diambil orang lain: kosongkan pilihan dan
        // muat ulang daftar slot dari server.
        setValue("startAt", "");
        router.refresh();
        return;
      }
      router.push(`/booking/${result.data.code}`);
    });
  });

  if (unavailableMessage) {
    return (
      <Alert variant="warning">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>{unavailableMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {formError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset className="space-y-4" disabled={isPending}>
        <legend className="mb-3 text-sm font-semibold">Jam mulai yang tersedia</legend>
        {groupSlots(slots).map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{group.title}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {group.slots.map((slot) => {
                const isSelected = slot.startAt === selectedStartAt;
                return (
                  <button
                    key={slot.startAt}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setValue("startAt", slot.startAt, { shouldValidate: true })}
                    className={cn(
                      "focus-visible:ring-ring/50 h-11 rounded-lg border text-sm font-semibold tabular-nums transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "bg-background hover:border-primary/50 hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {errors.startAt ? <p className="text-destructive text-sm">{errors.startAt.message}</p> : null}
      </fieldset>

      <div className="space-y-4">
        <p className="text-sm font-semibold">Data Anda</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="customerName">Nama</Label>
            <Input
              id="customerName"
              autoComplete="name"
              className="h-11"
              aria-invalid={errors.customerName ? true : undefined}
              disabled={isPending}
              {...register("customerName")}
            />
            {errors.customerName ? (
              <p className="text-destructive text-sm">{errors.customerName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerWhatsapp">WhatsApp</Label>
            <Input
              id="customerWhatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="081234567890"
              className="h-11"
              aria-invalid={errors.customerWhatsapp ? true : undefined}
              disabled={isPending}
              {...register("customerWhatsapp")}
            />
            {errors.customerWhatsapp ? (
              <p className="text-destructive text-sm">{errors.customerWhatsapp.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nama@email.com"
              className="h-11"
              aria-invalid={errors.customerEmail ? true : undefined}
              disabled={isPending}
              {...register("customerEmail")}
            />
            {errors.customerEmail ? (
              <p className="text-destructive text-sm">{errors.customerEmail.message}</p>
            ) : null}
          </div>

          <p className="text-muted-foreground text-sm sm:col-span-2">
            Isi minimal salah satu: WhatsApp atau email. Kontak ini dipakai untuk mengabari status pesanan
            Anda.
          </p>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              rows={3}
              aria-invalid={errors.notes ? true : undefined}
              disabled={isPending}
              {...register("notes")}
            />
            {errors.notes ? <p className="text-destructive text-sm">{errors.notes.message}</p> : null}
          </div>
        </div>
      </div>

      <div className="bg-muted/60 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CalendarCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold">{dateLabel}</p>
            <p className="text-muted-foreground" aria-live="polite">
              {selectedSlot
                ? `Jam ${selectedSlot.label} - ${selectedSlot.endLabel}`
                : "Belum ada jam yang dipilih"}
            </p>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {isPending ? "Menyimpan..." : "Buat pesanan"}
        </Button>
      </div>
    </form>
  );
}
