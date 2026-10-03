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
    // Layar lebar: sidebar permanen di kiri. Layar sempit (ponsel): sidebar
    // yang sama dilipat menjadi bilah menu di atas, karena sidebar tetap akan
    // menghabiskan lebar layar.
    <div className="min-h-dvh md:flex">
      <AdminNav businessName={env.BUSINESS_NAME} adminName={admin.name} />
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
