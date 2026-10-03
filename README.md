# Platform Booking & Management Servis UMKM

Aplikasi booking online untuk bisnis jasa lokal. Pelanggan memilih layanan, tanggal, dan jam yang masih kosong; admin mengelola pesanan, layanan, dan jadwal dari dasbor.

## Fitur

- Katalog layanan, pemilihan slot yang dihitung dinamis, dan halaman status pesanan lewat kode booking acak.
- Dasbor admin: jadwal harian, jumlah pesanan per status, ubah status, kelola layanan, jam operasional, dan hari libur.
- Notifikasi otomatis ke pelanggan (email dan/atau WhatsApp) saat pesanan dikonfirmasi atau dibatalkan.
- Tema terang/gelap mengikuti pengaturan browser.
- Anti double-booking di level database dan pembatas percobaan login.

## Teknologi

| Bagian | Yang dipakai |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Tampilan | Tailwind CSS v4, komponen Shadcn UI (Radix) |
| Database | PostgreSQL (Neon), Prisma 6 |
| Autentikasi | Auth.js v5 (Credentials) + bcryptjs |
| Form & validasi | React Hook Form + Zod |
| Waktu | date-fns + @date-fns/tz |
| Notifikasi | Brevo atau Resend (email), Fonnte (WhatsApp) |
| Hosting | Vercel |

## Menjalankan di lokal

Yang diperlukan: Node.js 20.9+ dan database PostgreSQL (mis. Neon).

```bash
npm install
cp .env.example .env      # lalu isi nilainya
npm run db:migrate        # membuat tabel
npm run db:seed           # akun admin, layanan contoh, jam operasional
npm run dev
```

- Pelanggan: http://localhost:3000
- Admin: http://localhost:3000/login (email dan password dari `SEED_ADMIN_*`)

## Environment variable

| Nama | Wajib? | Keterangan |
|---|---|---|
| `DATABASE_URL` | Wajib | Koneksi pooled (host Neon dengan `-pooler`) |
| `DIRECT_URL` | Wajib | Koneksi langsung, untuk migrasi |
| `AUTH_SECRET` | Wajib | String acak minimal 32 karakter |
| `BUSINESS_TIMEZONE` | Opsional | Default `Asia/Jakarta` |
| `BUSINESS_NAME` | Opsional | Default `Servis Kita` |
| `APP_URL` | Opsional | Alamat publik untuk tautan di notifikasi |
| `EMAIL_FROM` | Opsional | Pengirim email, format `Nama <alamat@domain>` |
| `BREVO_API_KEY` / `RESEND_API_KEY` | Opsional | Salah satu, untuk notifikasi email |
| `FONNTE_TOKEN` | Opsional | Untuk notifikasi WhatsApp |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Wajib untuk seed | Akun admin |

## Deploy ke Vercel

1. Push repo ke GitHub, lalu import di Vercel.
2. Isi environment variable di atas (tanpa `SEED_*`).
3. Set Build Command ke `npm run vercel-build`, lalu deploy.
