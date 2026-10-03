import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

const seedEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z
    .string({ required_error: "SEED_ADMIN_EMAIL wajib diisi." })
    .trim()
    .toLowerCase()
    .email("SEED_ADMIN_EMAIL harus berupa email yang valid."),
  SEED_ADMIN_PASSWORD: z
    .string({ required_error: "SEED_ADMIN_PASSWORD wajib diisi." })
    .min(8, "SEED_ADMIN_PASSWORD minimal 8 karakter."),
  SEED_ADMIN_NAME: z.string().trim().min(1).max(60).optional(),
});

type SeedService = {
  id: string;
  name: string;
  description: string;
  /** Deskripsi bawaan versi lama; dipakai untuk memperbarui teks yang belum diubah admin. */
  previousDescription: string;
  durationMinutes: number;
  price: number;
};

const SERVICES: SeedService[] = [
  {
    id: "seed-potong-rambut",
    name: "Potong Rambut",
    description:
      "Ngobrol dulu soal model yang dimau, baru gunting jalan. Sudah termasuk cuci dan ditata, jadi pulang dari sini langsung rapi.",
    previousDescription: "Potong rambut sesuai model pilihan, termasuk cuci dan styling ringan.",
    durationMinutes: 45,
    price: 50000,
  },
  {
    id: "seed-cukur-jenggot",
    name: "Cukur & Rapikan Jenggot",
    description:
      "Jenggot dan kumis dibentuk mengikuti garis wajah, dibantu handuk hangat supaya kulit tidak perih. Pas untuk tampil rapi tanpa harus cukur habis.",
    previousDescription: "Cukur bersih atau rapikan bentuk jenggot dan kumis.",
    durationMinutes: 30,
    price: 30000,
  },
  {
    id: "seed-creambath",
    name: "Creambath",
    description:
      "Satu jam untuk istirahat: rambut dirawat dengan krim, kepala sampai pundak dipijat pelan. Enak dipesan setelah minggu yang panjang.",
    previousDescription: "Perawatan rambut dengan krim dan pijat kepala.",
    durationMinutes: 60,
    price: 85000,
  },
  {
    id: "seed-paket-lengkap",
    name: "Paket Lengkap",
    description:
      "Potong rambut, rapikan jenggot, lalu ditutup creambath dalam satu kunjungan. Lebih hemat daripada pesan satu per satu, dan tidak perlu bolak-balik.",
    previousDescription: "Potong rambut, cukur jenggot, dan creambath dalam satu sesi.",
    durationMinutes: 120,
    price: 150000,
  },
];

type SeedBusinessHours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

// 0 = Minggu ... 6 = Sabtu. Default: Senin-Sabtu 09:00-17:00, Minggu tutup.
const BUSINESS_HOURS: SeedBusinessHours[] = [
  { dayOfWeek: 0, openTime: "09:00", closeTime: "17:00", isClosed: true },
  { dayOfWeek: 1, openTime: "09:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 2, openTime: "09:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 3, openTime: "09:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 4, openTime: "09:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 5, openTime: "09:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 6, openTime: "09:00", closeTime: "15:00", isClosed: false },
];

async function main(): Promise<void> {
  const parsed = seedEnvSchema.safeParse({
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || undefined,
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(`Environment variable untuk seed tidak valid:\n${details}`);
  }

  const adminName = parsed.data.SEED_ADMIN_NAME ?? "Admin";
  const passwordHash = await hash(parsed.data.SEED_ADMIN_PASSWORD, 12);

  // Admin: jika sudah ada, nama dan password disamakan dengan nilai env
  // (berguna untuk reset password lewat seed).
  const admin = await prisma.user.upsert({
    where: { email: parsed.data.SEED_ADMIN_EMAIL },
    update: { name: adminName, passwordHash },
    create: { email: parsed.data.SEED_ADMIN_EMAIL, name: adminName, passwordHash },
  });
  console.log(`Admin siap: ${admin.email}`);

  // Layanan contoh: hanya dibuat jika belum ada, agar perubahan dari dasbor
  // admin tidak tertimpa saat seed dijalankan ulang.
  for (const service of SERVICES) {
    const { previousDescription, ...data } = service;
    await prisma.service.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    });
    // Perbarui deskripsi HANYA jika masih sama persis dengan teks bawaan lama,
    // supaya deskripsi yang sudah ditulis ulang admin tidak ikut berubah.
    await prisma.service.updateMany({
      where: { id: data.id, description: previousDescription },
      data: { description: data.description },
    });
  }
  console.log(`Layanan contoh siap: ${SERVICES.length} layanan`);

  // Jam operasional default: sama, tidak menimpa pengaturan yang sudah ada.
  for (const hours of BUSINESS_HOURS) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: hours.dayOfWeek },
      update: {},
      create: hours,
    });
  }
  console.log("Jam operasional default siap: 7 hari");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
