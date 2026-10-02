"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle, Pencil, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { createServiceAction, updateServiceAction } from "@/actions/services";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/validations";

export type EditableService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

type ServiceFormDialogProps = {
  /** Kosong = tambah layanan baru; terisi = ubah layanan tersebut. */
  service?: EditableService;
};

const EMPTY_VALUES: ServiceFormValues = {
  name: "",
  description: "",
  durationMinutes: 30,
  price: 0,
  isActive: true,
};

export function ServiceFormDialog({ service }: ServiceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const initialValues: ServiceFormValues = service
    ? {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        isActive: service.isActive,
      }
    : EMPTY_VALUES;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: initialValues,
  });

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      // Selalu mulai dari data terbaru setiap kali dialog dibuka.
      reset(initialValues);
      setFormError(null);
    }
    setOpen(nextOpen);
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = service
        ? await updateServiceAction(service.id, values)
        : await createServiceAction(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setOpen(false);
    });
  });

  const idPrefix = service ? `service-${service.id}` : "service-new";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {service ? (
          <Button variant="outline" size="sm">
            <Pencil aria-hidden="true" />
            Ubah
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden="true" />
            Tambah layanan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Ubah layanan" : "Tambah layanan"}</DialogTitle>
          <DialogDescription>
            Perubahan harga dan durasi hanya berlaku untuk pesanan baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-name`}>Nama layanan</Label>
            <Input
              id={`${idPrefix}-name`}
              aria-invalid={errors.name ? true : undefined}
              disabled={isPending}
              {...register("name")}
            />
            {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-description`}>Deskripsi (opsional)</Label>
            <Textarea
              id={`${idPrefix}-description`}
              rows={3}
              aria-invalid={errors.description ? true : undefined}
              disabled={isPending}
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-duration`}>Durasi (menit)</Label>
              <Input
                id={`${idPrefix}-duration`}
                type="number"
                inputMode="numeric"
                min={5}
                max={480}
                step={5}
                aria-invalid={errors.durationMinutes ? true : undefined}
                disabled={isPending}
                {...register("durationMinutes", { valueAsNumber: true })}
              />
              {errors.durationMinutes ? (
                <p className="text-destructive text-sm">{errors.durationMinutes.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-price`}>Harga (rupiah)</Label>
              <Input
                id={`${idPrefix}-price`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                aria-invalid={errors.price ? true : undefined}
                disabled={isPending}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price ? <p className="text-destructive text-sm">{errors.price.message}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id={`${idPrefix}-active`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Label htmlFor={`${idPrefix}-active`}>Aktif (tampil di katalog pelanggan)</Label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
