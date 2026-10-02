import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: {
    default: env.BUSINESS_NAME,
    template: `%s | ${env.BUSINESS_NAME}`,
  },
  description: `Pesan layanan ${env.BUSINESS_NAME} secara online: pilih layanan, tanggal, dan jam yang tersedia.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
