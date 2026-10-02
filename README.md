# Platform Booking & Management Servis UMKM

Aplikasi booking online untuk bisnis jasa lokal (barbershop, salon, bengkel, klinik kecil, dan sejenisnya).

- **Sisi pelanggan (publik):** katalog layanan, pilih tanggal dan jam yang masih tersedia, form pemesanan, dan halaman konfirmasi yang dibuka lewat kode booking acak.
- **Sisi admin (terproteksi):** dasbor jadwal dan jumlah pesanan per status, ubah status pesanan, kelola layanan, jam operasional, dan hari libur.

Stack: Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · komponen Shadcn UI (ditulis manual) · Prisma 6 · PostgreSQL (Neon) · Auth.js v5 · React Hook Form + Zod · date-fns.

---

## 1. Aplikasi dan akun yang diperlukan

| Kebutuhan | Wajib? | Kegunaan | Versi minimum | Unduh / daftar | Cara cek |
|---|---|---|---|---|---|
| Node.js (sudah termasuk npm) | Wajib | Menjalankan dan mem-build aplikasi | Node 20.9 (disarankan 22 LTS) | https://nodejs.org | `node -v` dan `npm -v` |
| Git | Wajib untuk deploy via GitHub | Menyimpan kode dan mengirimnya ke GitHub | 2.x | https://git-scm.com | `git --version` |
| Editor kode (mis. VS Code) | Disarankan | Mengisi `.env` dan mengubah kode | - | https://code.visualstudio.com | - |
| Browser modern | Wajib | Membuka aplikasi | Chrome/Edge/Firefox terbaru | - | - |
| Akun Neon | Wajib | Database PostgreSQL gratis | - | https://neon.tech | - |
| Akun GitHub | Wajib untuk deploy via GitHub | Menyimpan repo yang di-import Vercel | - | https://github.com | - |
| Akun Vercel | Wajib untuk deploy | Hosting aplikasi | - | https://vercel.com | - |
| Vercel CLI | Opsional | Deploy dari terminal | terbaru | `npm i -g vercel` | `vercel --version` |

Tidak perlu memasang PostgreSQL di komputer: database berjalan di Neon.

---

## 2. Menjalankan di komputer lokal

Jalankan semua perintah dari dalam folder proyek (folder yang berisi `package.json`).

### Langkah 1 - Ekstrak dan buka folder

Ekstrak `booking-umkm.zip`, lalu buka terminal di folder hasil ekstrak:

```bash
cd booking-umkm
```

### Langkah 2 - Pasang dependency

```bash
npm install
```

Perintah ini juga menjalankan `prisma generate` secara otomatis (skrip `postinstall`). Setelah selesai akan muncul file `package-lock.json`; ikut sertakan file itu saat commit.

### Langkah 3 - Buat database Neon dan ambil dua URL

1. Masuk ke https://console.neon.tech lalu buat **Project** baru. Pilih region terdekat, mis. **AWS Asia Pacific (Singapore)**.
2. Di halaman project, klik **Connect**.
3. Dengan sakelar **Connection pooling AKTIF**, salin connection string. Host-nya mengandung `-pooler`. Ini nilai `DATABASE_URL`.
4. **Matikan** sakelar Connection pooling, salin lagi. Host-nya tanpa `-pooler`. Ini nilai `DIRECT_URL`.

Contoh bentuknya:

```text
DATABASE_URL = postgresql://user:pass@ep-nama-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL   = postgresql://user:pass@ep-nama-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Memakai Supabase? `DATABASE_URL` = koneksi pooler mode transaction (port 6543) ditambah `?pgbouncer=true`, `DIRECT_URL` = koneksi port 5432.

### Langkah 4 - Buat file `.env`

macOS / Linux / Git Bash:

```bash
cp .env.example .env
```

Windows (Command Prompt):

```bat
copy .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Buka `.env` dan isi setiap variabel (lihat tabel di bagian 5). Untuk `AUTH_SECRET`, buat string acak:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Langkah 5 - Buat tabel dan data awal

```bash
npm run db:migrate
npm run db:seed
```

`db:migrate` menerapkan migrasi di `prisma/migrations` (termasuk constraint anti double-booking). Jika ditanya nama migrasi baru, itu berarti Prisma mendeteksi perbedaan; lihat bagian Troubleshooting.

`db:seed` membuat akun admin dari `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD`, empat layanan contoh, dan jam operasional default (Senin-Sabtu buka, Minggu tutup). Aman dijalankan berulang kali.

### Langkah 6 - Jalankan

```bash
npm run dev
```

Buka di browser:

| Alamat | Isi |
|---|---|
| http://localhost:3000 | Sisi pelanggan: katalog layanan dan pemesanan |
| http://localhost:3000/login | Login admin (pakai email dan password dari `SEED_ADMIN_*`) |
| http://localhost:3000/admin | Dasbor admin (otomatis dialihkan ke login bila belum masuk) |

### Perintah lain

| Perintah | Kegunaan |
|---|---|
| `npm run build` lalu `npm run start` | Build dan jalankan mode produksi secara lokal |
| `npm run lint` | Pemeriksaan ESLint |
| `npm run typecheck` | Pemeriksaan TypeScript tanpa build |
| `npm run db:deploy` | Menerapkan migrasi tanpa prompt (dipakai di produksi) |
| `npm run db:studio` | Membuka Prisma Studio untuk melihat isi database |

---

## 3. Deploy ke Vercel lewat GitHub

1. Buat repo kosong di GitHub, lalu dari folder proyek:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```

2. Di https://vercel.com/new, pilih **Import** repo tersebut. Framework Preset akan terdeteksi sebagai **Next.js**.
3. Buka **Environment Variables** dan isi: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, serta (opsional) `BUSINESS_TIMEZONE` dan `BUSINESS_NAME`. Variabel `SEED_*` tidak perlu diisi di Vercel.
4. Buka **Build and Output Settings**, aktifkan override **Build Command**, isi:

   ```text
   npm run vercel-build
   ```

   Skrip ini menjalankan `prisma migrate deploy` lalu `next build`, sehingga tabel dibuat otomatis saat deploy.
5. Klik **Deploy**.
6. Isi data awal ke database produksi, satu kali, dari komputer lokal. Pastikan `.env` lokal berisi URL database produksi, lalu:

   ```bash
   npm run db:seed
   ```

   Jika database lokal dan produksi memang sama (satu project Neon), langkah ini sudah Anda lakukan di bagian 2.

---

## 4. Deploy ke Vercel lewat CLI

```bash
npm i -g vercel
vercel login
vercel link

vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add AUTH_SECRET production
vercel env add BUSINESS_TIMEZONE production
vercel env add BUSINESS_NAME production

vercel --prod
```

Setiap `vercel env add` akan meminta nilainya. Dua yang terakhir opsional. Vercel otomatis memakai skrip `vercel-build` bila ada di `package.json`; jika Build Command pernah diubah di dasbor, pastikan isinya `npm run vercel-build`.

---

## 5. Environment variable

| Nama | Contoh nilai | Wajib? | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@ep-x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Wajib | Koneksi **pooled**, dipakai aplikasi saat runtime |
| `DIRECT_URL` | `postgresql://user:pass@ep-x.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Wajib | Koneksi **langsung**, dipakai Prisma Migrate |
| `AUTH_SECRET` | hasil `openssl rand -base64 32` | Wajib | Kunci penandatangan sesi, minimal 32 karakter |
| `BUSINESS_TIMEZONE` | `Asia/Jakarta` | Opsional | Zona waktu bisnis (IANA). Default `Asia/Jakarta` |
| `BUSINESS_NAME` | `Barbershop Maju Jaya` | Opsional | Nama bisnis di header. Default `Servis Kita` |
| `SEED_ADMIN_EMAIL` | `admin@example.com` | Wajib untuk seed | Email akun admin |
| `SEED_ADMIN_PASSWORD` | `password-yang-kuat` | Wajib untuk seed | Password admin, minimal 8 karakter |
| `SEED_ADMIN_NAME` | `Admin` | Opsional | Nama tampilan admin. Default `Admin` |

---

## 6. Cara kerja singkat

- **Zona waktu.** Jam buka disimpan sebagai jam lokal bisnis (`"09:00"`), sedangkan `startAt`/`endAt` booking disimpan sebagai UTC. Konversi memakai `BUSINESS_TIMEZONE`, sehingga hasilnya benar walaupun server Vercel berjalan di UTC.
- **Slot.** Dihitung di server dari jam operasional, hari libur, durasi layanan, dan booking yang belum dibatalkan. Slot dimulai tiap 30 menit, paling cepat 60 menit dari sekarang, paling jauh 60 hari ke depan. Ketiga angka ini ada di `src/lib/constants.ts`.
- **Anti double-booking.** Exclusion constraint `Booking_no_overlap` di PostgreSQL menolak dua booking aktif yang waktunya beririsan, sekalipun dua pelanggan menekan tombol pada saat yang sama. Pelanggan kedua menerima pesan "Slot sudah terisi". Constraint ini berlaku untuk seluruh bisnis (satu pelanggan pada satu waktu).
- **Keamanan admin.** `/admin` dijaga middleware, lalu dicek ulang di setiap halaman admin dan setiap Server Action (`src/lib/auth-guard.ts`), termasuk memastikan akun admin masih ada di database.
- **Status pesanan.** PENDING -> CONFIRMED atau CANCELED; CONFIRMED -> COMPLETED atau CANCELED. COMPLETED dan CANCELED bersifat final.
- **Layanan.** Tidak dihapus, hanya dinonaktifkan. Booking menyimpan snapshot nama, harga, dan durasi, jadi riwayat tidak berubah saat layanan diedit.

### Struktur folder

```text
prisma/            schema, migrasi SQL, seed
src/app/           halaman (App Router): (public), login, admin, api/auth
src/actions/       Server Actions (semuanya mengembalikan ActionResult<T>)
src/components/    ui (Shadcn), booking, admin, auth
src/lib/           env, prisma, waktu, slot, validasi Zod, util
src/types/         tipe bersama
```

### Keterbatasan yang perlu diketahui

- Belum ada pembatas percobaan login (rate limit) dan belum ada pembatas jumlah pesanan per pelanggan.
- Belum ada notifikasi WhatsApp/email otomatis; admin menghubungi pelanggan lewat tautan di dasbor.
- Menambahkan hari libur tidak membatalkan pesanan yang sudah ada pada tanggal itu; admin diberi tahu jumlahnya.

---

## 7. Troubleshooting

**`npm error code ETARGET` / `No matching version found for ...` saat `npm install`**
Nomor versi sebuah paket di `package.json` tidak ada di registry. Lihat versi yang tersedia dengan `npm view NAMA-PAKET versions`, ganti angkanya di `package.json` dengan patch terdekat, lalu jalankan `npm install` lagi. `next` dan `eslint-config-next` harus bernomor sama; begitu juga `prisma` dengan `@prisma/client`, dan `tailwindcss` dengan `@tailwindcss/postcss`.

**`npm error ERESOLVE` (konflik peer dependency)**
Biasanya terjadi setelah mengganti versi. Samakan dulu pasangan paket di atas. Jika masih gagal, jalankan `npm install --legacy-peer-deps` dan buat file `.npmrc` berisi `legacy-peer-deps=true` agar Vercel memakai perilaku yang sama.

**`Environment variable tidak valid: ...` saat build atau dev**
Berasal dari `src/lib/env.ts`. Pesannya menyebut variabel yang salah. Di lokal, periksa `.env`; di Vercel, periksa Settings -> Environment Variables lalu **Redeploy**. Build lokal (`npm run build`) juga membutuhkan `.env`.

**`Environment variable not found: DIRECT_URL` / `DATABASE_URL` (dari Prisma)**
Variabel belum diisi. Di Vercel, pastikan variabel dicentang untuk environment **Production** (dan Preview bila dipakai).

**`P1001: Can't reach database server`**
URL salah, atau database Neon sedang tidur. Coba lagi beberapa detik kemudian, dan tambahkan `&connect_timeout=15` di akhir URL. Pastikan `DIRECT_URL` tanpa `-pooler`.

**`prisma migrate deploy` gagal atau menggantung di Vercel**
Hampir selalu karena `DIRECT_URL` berisi URL pooled. Migrasi harus lewat koneksi langsung.

**`permission denied to create extension "btree_gist"`**
Role database tidak boleh membuat extension. Di Neon dan Supabase role bawaan boleh. Di penyedia lain, jalankan `CREATE EXTENSION IF NOT EXISTS btree_gist;` sekali sebagai superuser, lalu ulangi migrasi.

**`prisma migrate dev` menawarkan migrasi baru yang berisi `DROP ... "Booking_no_overlap"` atau `DROP CONSTRAINT ..._check`**
Prisma tidak mengenal exclusion/check constraint yang ditulis manual. Jangan terapkan: hapus baris `DROP` tersebut dari file SQL migrasi baru sebelum dijalankan, atau batalkan migrasinya.

**`MissingSecret` atau `UntrustedHost` dari Auth.js**
`AUTH_SECRET` belum diisi di environment tersebut. `trustHost` sudah diaktifkan di `src/auth.config.ts`.

**Login selalu "Email atau password salah"**
Seed belum dijalankan ke database yang sama dengan yang dipakai aplikasi. Jalankan `npm run db:seed` dengan `.env` yang menunjuk ke database itu. Menjalankan ulang seed juga mengatur ulang password admin sesuai `SEED_ADMIN_PASSWORD`.

**Error TypeScript atau ESLint saat `next build`**
Jalankan `npm run typecheck` dan `npm run lint` di lokal untuk melihat pesan lengkapnya (nama file dan nomor baris), lalu perbaiki di file tersebut.

**`Module not found: Can't resolve '@/...'`**
Pastikan struktur folder tidak berubah saat ekstrak (harus ada `src/` langsung di bawah folder proyek) dan `tsconfig.json` masih memuat `"paths": { "@/*": ["./src/*"] }`.

**Katalog kosong atau semua tanggal "Tutup"**
Seed belum dijalankan (belum ada layanan dan jam operasional). Jalankan `npm run db:seed`, atau isi lewat `/admin/services` dan `/admin/schedule`.

**Jam slot bergeser beberapa jam**
`BUSINESS_TIMEZONE` tidak sesuai lokasi bisnis. Gunakan `Asia/Jakarta` (WIB), `Asia/Makassar` (WITA), atau `Asia/Jayapura` (WIT), lalu redeploy.

**Peringatan `package.json#prisma is deprecated`**
Hanya peringatan dari Prisma 6, bukan error. Seed tetap berjalan.
