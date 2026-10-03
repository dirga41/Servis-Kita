import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/site/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth-guard";
import { env } from "@/lib/env";

// Membaca sesi dan database: jangan di-prerender saat build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk Admin",
  // Halaman login tidak ditautkan dari situs publik dan tidak perlu diindeks.
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12" />
          <p className="font-semibold tracking-tight">{env.BUSINESS_NAME}</p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Masuk Admin</CardTitle>
            <CardDescription>Kelola pesanan, layanan, dan jadwal.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm callbackUrl={callbackUrl} />
          </CardContent>
        </Card>
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/" className="hover:text-foreground underline underline-offset-4">
            Kembali ke halaman pemesanan
          </Link>
        </p>
      </div>
    </main>
  );
}
