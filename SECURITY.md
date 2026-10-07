# Keamanan

Jangan membuka laporan kerentanan yang memuat data pengguna, token, atau langkah eksploitasi aktif sebagai issue publik. Kirim laporan secara privat kepada pengelola repositori dan sertakan dampak, langkah reproduksi yang aman, serta versi yang terdampak.

Sebelum menjalankan Skripsync di produksi:

- Simpan Google OAuth Client Secret hanya di Supabase.
- Aktifkan Row Level Security pada tabel data pengguna.
- Batasi daftar redirect URL ke domain yang benar-benar digunakan.
- Jangan commit `.env.local` atau kredensial layanan.
- Perbarui dependensi secara berkala dan jalankan pemeriksaan build sebelum deploy.
