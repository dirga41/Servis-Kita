"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Halaman tidak dapat dimuat. Silakan coba lagi beberapa saat lagi.
      </p>
      {error.digest ? <p className="text-muted-foreground text-xs">Kode: {error.digest}</p> : null}
      <Button onClick={reset}>Coba lagi</Button>
    </main>
  );
}
