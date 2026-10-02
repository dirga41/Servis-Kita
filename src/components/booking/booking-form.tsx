"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { createBookingAction } from "@/actions/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookingFormSchema, type BookingFormValues } from "@/lib/validations";
import type { Slot } from "@/types";

type BookingFormProps = {
  serviceId: string;
  slots: Slot[];
  /** Diisi jika tanggal yang dipilih tidak bisa dipesan (tutup, libur, penuh). */
  unavailableMessage: string | null;
};

export function BookingForm({ serviceId, slots, unavailableMessage }: BookingFormProps) {
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
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset className="space-y-2" disabled={isPending}>
        <legend className="mb-2 text-sm font-medium">Jam mulai</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.map((slot) => {
            const isSelected = slot.startAt === selectedStartAt;
            return (
              <Button
                key={slot.startAt}
                type="button"
                variant={isSelected ? "default" : "outline"}
                aria-pressed={isSelected}
                onClick={() => setValue("startAt", slot.startAt, { shouldValidate: true })}
              >
                {slot.label}
              </Button>
            );
          })}
        </div>
        {errors.startAt ? <p className="text-destructive text-sm">{errors.startAt.message}</p> : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customerName">Nama</Label>
          <Input
            id="customerName"
            autoComplete="name"
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
            aria-invalid={errors.customerEmail ? true : undefined}
            disabled={isPending}
            {...register("customerEmail")}
          />
          {errors.customerEmail ? (
            <p className="text-destructive text-sm">{errors.customerEmail.message}</p>
          ) : null}
        </div>

        <p className="text-muted-foreground text-sm sm:col-span-2">
          Isi minimal salah satu: WhatsApp atau email.
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

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
        {isPending ? "Menyimpan..." : "Buat pesanan"}
      </Button>
    </form>
  );
}
