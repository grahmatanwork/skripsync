# Skripsync

Skripsync adalah workspace skripsi yang menyatukan tugas, progres, jadwal bimbingan, kalender, arsip tautan, pengingat, dan asisten dalam satu aplikasi web yang dapat dipasang di perangkat.

Versi ini berjalan sebagai aplikasi Next.js mandiri. Akun pengguna memakai Google melalui Supabase Auth dan setiap akun hanya dapat mengakses datanya sendiri melalui Row Level Security (RLS).

## Fitur

- Dashboard progres skripsi
- To-do list dengan seleksi dan hapus banyak tugas
- Kalender yang tersinkron dengan tugas dan jadwal bimbingan
- Dua atau lebih dosen pembimbing yang dapat diubah pengguna
- Arsip Google Drive, Docs, Sheets, dan tautan lain dengan ikon sesuai jenisnya
- Profil pengguna beserta foto, jurusan, universitas, dan judul skripsi
- Pengingat deadline melalui notifikasi browser
- Tampilan responsif dan PWA untuk instalasi di Android, iOS, dan desktop
- Login Google
- Penyimpanan terpisah untuk setiap akun
- Impor progres dari Skripsync versi GPT Site

## Teknologi

- Next.js 16 dan React 19
- TypeScript
- Supabase Auth dan Postgres
- Tailwind CSS 4
- PWA manifest dan service worker

## Menjalankan secara lokal

Persyaratan:

- Node.js 22.13 atau lebih baru
- pnpm 11
- Proyek Supabase
- OAuth Client Google

Salin konfigurasi lingkungan:

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Pasang dependensi dan jalankan aplikasi:

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:3000`.

## Menyiapkan database

1. Buat proyek baru di Supabase.
2. Buka **SQL Editor**.
3. Jalankan isi `supabase/migrations/202610060001_trackers.sql`.
4. Pastikan tabel `public.trackers` memiliki RLS aktif.

Migrasi membuat satu dokumen tracker per pengguna. Kebijakan RLS membatasi operasi baca, buat, dan ubah berdasarkan `auth.uid()`.

## Menyiapkan login Google

1. Di Google Cloud Console, buat OAuth Client bertipe **Web application**.
2. Tambahkan URI callback Supabase berikut ke **Authorized redirect URIs**:

   ```text
   https://PROJECT_REF.supabase.co/auth/v1/callback
   ```

3. Di Supabase, buka **Authentication → Providers → Google** lalu masukkan Client ID dan Client Secret dari Google.
4. Di **Authentication → URL Configuration**, atur Site URL dan tambahkan redirect yang diizinkan:

   ```text
   http://localhost:3000/auth/callback
   https://DOMAIN_KAMU/auth/callback
   ```

Client Secret Google disimpan di dashboard Supabase. Jangan masukkan rahasia tersebut ke `.env.local` atau repositori.

## Deploy

Repositori ini dapat dipasang di penyedia hosting Next.js. Untuk Vercel:

1. Impor repositori GitHub.
2. Tambahkan dua variabel dari `.env.example` ke pengaturan proyek.
3. Deploy.
4. Masukkan domain hasil deploy ke Site URL dan redirect allowlist Supabase.
5. Tambahkan domain tersebut ke **Authorized JavaScript origins** pada Google OAuth Client.

Perintah build produksi:

```bash
pnpm build
pnpm start
```

## Memindahkan data dari versi lama

1. Masuk ke Skripsync lama.
2. Buka `/api/tracker` pada domain lama lalu simpan responsnya sebagai file `.json`.
3. Masuk ke Skripsync baru dengan Google.
4. Buka dashboard sekali agar data awal dibuat.
5. Buka `/import`, pilih file JSON, periksa ringkasannya, lalu impor.

Impor hanya dapat berjalan ketika data akun baru belum pernah diubah. Pemeriksaan ini mencegah progres baru tertimpa tanpa sengaja.

## Pemeriksaan sebelum kontribusi

```bash
pnpm typecheck
pnpm build
```

## Lisensi

Kode sumber Skripsync tersedia dengan [MIT License](LICENSE).
