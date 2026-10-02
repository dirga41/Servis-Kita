// Konfigurasi Auth.js yang AMAN UNTUK EDGE: dipakai middleware, jadi file ini
// tidak boleh mengimpor Prisma, bcryptjs, atau modul "server-only".
// Provider Credentials (yang butuh database) ditambahkan di src/auth.ts.

import type { NextAuthConfig } from "next-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 jam

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  // Vercel selalu berada di belakang proxy; host dipercaya dari header.
  trustHost: true,
  providers: [],
  callbacks: {
    // Dipanggil middleware. Mengembalikan false = redirect ke pages.signIn
    // dengan query ?callbackUrl=... yang berisi alamat asal.
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminRoute) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
