import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminPage } from "@/lib/auth-guard";
import { env } from "@/lib/env";

// Membaca sesi dan database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: `%s | Admin ${env.BUSINESS_NAME}`,
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-card border-b">
        <AdminNav businessName={env.BUSINESS_NAME} adminName={admin.name} />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
