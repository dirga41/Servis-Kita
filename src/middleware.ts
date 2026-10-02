// Lapisan pertama perlindungan /admin. Hanya memeriksa keberadaan sesi (JWT);
// pengecekan penuh ke database diulang di setiap halaman admin dan Server
// Action lewat src/lib/auth-guard.ts.

import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // ":path*" juga cocok dengan "/admin" itu sendiri.
  matcher: ["/admin/:path*"],
};
