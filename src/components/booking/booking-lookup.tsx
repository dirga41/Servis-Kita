"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKING_CODE_LENGTH } from "@/lib/constants";

/** Form kecil untuk membuka halaman detail pesanan dari kode booking. */
export function BookingLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length !== BOOKING_CODE_LENGTH) {
      setError(`Kode booking terdiri dari ${BOOKING_CODE_LENGTH} karakter.`);
      return;
    }
    setError(null);
    router.push(`/booking/${normalized}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <Label htmlFor="booking-code">Kode booking</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="booking-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Contoh: 28XA7M65MA6F"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={BOOKING_CODE_LENGTH + 4}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "booking-code-error" : undefined}
          className="h-11 font-mono tracking-wider uppercase"
        />
        <Button type="submit" size="lg" className="shrink-0">
          <Search aria-hidden="true" />
          Cek status
        </Button>
      </div>
      {error ? (
        <p id="booking-code-error" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </form>
  );
}
