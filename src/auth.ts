import "server-only";

import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { clearLoginAttempts, getLoginKeys, isLoginBlocked, recordFailedLogin } from "@/lib/login-throttle";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

// Hash bcrypt valid (cost 12) yang tidak cocok dengan password apa pun yang
// kita simpan. Dipakai saat email tidak ditemukan, supaya waktu respons tidak
// membocorkan apakah sebuah email terdaftar.
const DUMMY_PASSWORD_HASH = "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        // Validasi ulang di server; jangan percaya input client.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();

        // Pembatas brute force ditaruh di sini (bukan hanya di Server Action)
        // supaya juga berlaku untuk request langsung ke /api/auth.
        const loginKeys = getLoginKeys(email, request.headers);
        if (await isLoginBlocked(loginKeys)) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        const passwordMatches = await compare(
          parsed.data.password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );
        if (!user || !passwordMatches) {
          await recordFailedLogin(loginKeys);
          return null;
        }

        await clearLoginAttempts(loginKeys);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
