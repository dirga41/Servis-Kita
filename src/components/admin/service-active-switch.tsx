"use client";

import { useState, useTransition } from "react";

import { setServiceActiveAction } from "@/actions/services";
import { Switch } from "@/components/ui/switch";

type ServiceActiveSwitchProps = {
  serviceId: string;
  serviceName: string;
  isActive: boolean;
};

export function ServiceActiveSwitch({ serviceId, serviceName, isActive }: ServiceActiveSwitchProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(checked: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setServiceActiveAction({ serviceId, isActive: checked });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={handleChange}
          disabled={isPending}
          aria-label={`Aktifkan layanan ${serviceName}`}
        />
        <span className="text-muted-foreground text-sm">{isActive ? "Aktif" : "Nonaktif"}</span>
      </div>
      {error ? <p className="text-destructive max-w-48 text-xs">{error}</p> : null}
    </div>
  );
}
