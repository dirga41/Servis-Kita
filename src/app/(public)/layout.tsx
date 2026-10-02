import type { ReactNode } from "react";
import Link from "next/link";

import { env } from "@/lib/env";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-card border-b">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            {env.BUSINESS_NAME}
          </Link>
          <span className="text-muted-foreground text-sm">Booking online</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 text-sm">
          <span>{env.BUSINESS_NAME}</span>
          <Link href="/login" className="hover:text-foreground underline underline-offset-4">
            Masuk admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
