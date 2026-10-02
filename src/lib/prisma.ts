import "server-only";

import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

// Singleton: di serverless (Vercel) dan saat hot-reload di dev, modul bisa
// dievaluasi berulang kali. Menyimpan instance di globalThis mencegah
// terbukanya banyak koneksi database.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
